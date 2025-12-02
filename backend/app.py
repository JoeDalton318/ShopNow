from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import sqlite3
import os
import hashlib
import secrets
from kafka_producer import envoyer_evenement
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))
CORS(app, supports_credentials=True)
DB = "database.db"

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    conn = sqlite3.connect(DB)
    try:
        with open("schema.sql", "r") as f:
            conn.executescript(f.read())
        print("✅ Base de données initialisée")
    except sqlite3.OperationalError as e:
        print("⚠️ DB déjà initialisée :", e)
    finally:
        conn.commit()
        conn.close()
@app.route('/produits', methods=['GET'])
def get_produits():
    conn = sqlite3.connect(DB)
    
    search = request.args.get('search', '')
    categorie_nom = request.args.get('categorie__nom', '')
    niveau_prix = request.args.get('niveau_prix', '')
    ordering = request.args.get('ordering', '')
    gender = request.args.get('gender', '')
    colour = request.args.get('colour', '')
    season = request.args.get('season', '')
    usage = request.args.get('usage', '')
    query = "SELECT p.id, p.nom, p.prix, p.stock, p.categorie_id, p.image_path, p.gender, p.base_colour, p.season, p.usage FROM produits p"
    conditions = []
    params = []
    if categorie_nom:
        query += " JOIN categories c ON p.categorie_id = c.id"
        conditions.append("c.nom = ?")
        params.append(categorie_nom)
    if search:
        conditions.append("p.nom LIKE ?")
        params.append(f"%{search}%")
    if niveau_prix == 'low':
        conditions.append("p.prix < 50")
    elif niveau_prix == 'medium':
        conditions.append("p.prix BETWEEN 50 AND 200")
    elif niveau_prix == 'high':
        conditions.append("p.prix > 200")
    
    # Filtre par genre
    if gender:
        conditions.append("p.gender = ?")
        params.append(gender)
    
    # Filtre par couleur
    if colour:
        conditions.append("p.base_colour = ?")
        params.append(colour)
    
    # Filtre par saison
    if season:
        conditions.append("p.season = ?")
        params.append(season)
    
    # Filtre par usage
    if usage:
        conditions.append("p.usage = ?")
        params.append(usage)
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    if ordering == 'prix':
        query += " ORDER BY p.prix ASC"
    elif ordering == '-prix':
        query += " ORDER BY p.prix DESC"
    elif ordering == 'nom':
        query += " ORDER BY p.nom ASC"
    else:
        query += " ORDER BY p.id ASC"
    
    produits = conn.execute(query, params).fetchall()
    conn.close()
    
    result = []
    for p in produits:
        prod_dict = {
            'id': p[0],
            'nom': p[1],
            'prix': p[2],
            'stock': p[3],
            'categorie_id': p[4],
            'gender': p[6],
            'base_colour': p[7],
            'season': p[8],
            'usage': p[9]
        }
        if p[5]:
            prod_dict['image_url'] = f"http://localhost:8000{p[5]}"
        else:
            prod_dict['image_url'] = f"https://picsum.photos/seed/{p[0]}/400/400"
        result.append(prod_dict)
    
    return jsonify(result)

@app.route('/produits/<int:produit_id>', methods=['GET'])
def get_produit_by_id(produit_id):
    conn = sqlite3.connect(DB)
    produit = conn.execute("SELECT * FROM produits WHERE id = ?", (produit_id,)).fetchone()
    variantes = conn.execute("SELECT id, taille, couleur, quantite_stock, prix_variant FROM variantes WHERE produit_id = ?", (produit_id,)).fetchall()
    
    if produit:
        produit_info = dict(zip(['id', 'nom', 'description', 'prix', 'categorie_id', 'stock', 'image_path'], produit))
        produit_info["variantes"] = [dict(zip(['id', 'taille', 'couleur', 'quantite_stock', 'prix_variant'], v)) for v in variantes]
        # Utiliser l'image réelle ou placeholder
        if produit_info.get('image_path'):
            produit_info['image_url'] = f"http://localhost:8000{produit_info['image_path']}"
        else:
            produit_info['image_url'] = f"https://picsum.photos/seed/{produit_id}/600/600"
        produit_info.pop('image_path', None)
        
        # Enregistrer dans l'historique (avec ou sans utilisateur)
        user_id = session.get('user_id', 0)
        try:
            conn.execute(
                "INSERT INTO historique_consultations (utilisateur_id, produit_id) VALUES (?, ?)",
                (user_id, produit_id)
            )
            conn.commit()
        except Exception as e:
            print(f"⚠️ Erreur enregistrement historique: {e}")
        
        conn.close()
        
        event = {
            "id_produit": produit_id,
            "nom_produit": produit_info['nom'],
            "timestamp": datetime.utcnow().isoformat(),
            "prix": produit_info['prix'],
            "user_id": session.get('user_id')
        }
        try:
            envoyer_evenement("produit-consulte", event)
        except Exception as e:
            print(f"⚠️ Erreur envoi événement produit-consulte: {e}")
        
        return jsonify(produit_info)
    
    conn.close()
    return jsonify({'error': 'Produit non trouvé'}), 404

@app.route('/categories', methods=['GET'])
def get_categories():
    conn = sqlite3.connect(DB)
    categories = conn.execute("SELECT * FROM categories").fetchall()
    conn.close()
    return jsonify([dict(zip(['id', 'nom', 'description'], c)) for c in categories])

@app.route('/panier/ajouter', methods=['POST'])
def ajouter_au_panier():
    data = request.json
    timestamp = datetime.utcnow().isoformat()
    
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    # Support pour variante_id OU produit_id
    if data.get('variante_id'):
        variante = cursor.execute(
            "SELECT v.*, p.nom FROM variantes v JOIN produits p ON v.produit_id = p.id WHERE v.id = ?", 
            (data['variante_id'],)
        ).fetchone()
        
        if not variante:
            conn.close()
            return jsonify({'error': 'Variante non trouvée'}), 404
        
        produit_id = variante[1]
        nom_produit = variante[6]
        prix_unitaire = variante[5] if variante[5] else 0
        variante_id = data['variante_id']
        nouveau_stock = None
    elif data.get('produit_id'):
        produit = cursor.execute(
            "SELECT id, nom, prix, stock FROM produits WHERE id = ?",
            (data['produit_id'],)
        ).fetchone()
        
        if not produit:
            conn.close()
            return jsonify({'error': 'Produit non trouvé'}), 404
        
        produit_id = produit[0]
        nom_produit = produit[1]
        prix_unitaire = produit[2]
        stock_actuel = produit[3]
        quantite = data.get('quantite', 1)
        
        if stock_actuel < quantite:
            conn.close()
            return jsonify({'error': 'Stock insuffisant', 'stock_disponible': stock_actuel}), 400
        
        # Décrémenter le stock
        nouveau_stock = stock_actuel - quantite
        cursor.execute(
            "UPDATE produits SET stock = ? WHERE id = ?",
            (nouveau_stock, produit_id)
        )
        conn.commit()
        
        # Envoyer événement stock mis à jour
        stock_event = {
            "produit_id": produit_id,
            "ancien_stock": stock_actuel,
            "nouveau_stock": nouveau_stock,
            "raison": "ajout_panier",
            "timestamp": timestamp
        }
        try:
            envoyer_evenement("stock-mis-a-jour", stock_event)
        except Exception as e:
            print(f"⚠️ Erreur envoi événement stock: {e}")
        
        variante = cursor.execute(
            "SELECT id FROM variantes WHERE produit_id = ? LIMIT 1",
            (produit_id,)
        ).fetchone()
        
        variante_id = variante[0] if variante else produit_id
    else:
        conn.close()
        return jsonify({'error': 'variante_id ou produit_id requis'}), 400
    
    conn.close()
    
    event = {
        "client_id": data.get('client_id', 0),
        "variante_id": variante_id,
        "produit_id": produit_id,
        "nom_produit": nom_produit,
        "quantite": data.get('quantite', 1),
        "prix_unitaire": prix_unitaire,
        "timestamp": timestamp
    }
    
    try:
        envoyer_evenement("article-ajoute", event)
        return jsonify({"message": "Article ajouté au panier", "event": event, "nouveau_stock": nouveau_stock}), 201
    except Exception as e:
        return jsonify({'error': f'Erreur Kafka: {str(e)}'}), 500

@app.route('/stock/update', methods=['POST'])
def update_stock():
    data = request.json
    timestamp = datetime.utcnow().isoformat()
    
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    # Récupérer l'ancien stock
    ancien_stock = cursor.execute("SELECT stock FROM produits WHERE id = ?", (data['produit_id'],)).fetchone()
    
    if not ancien_stock:
        conn.close()
        return jsonify({'error': 'Produit non trouvé'}), 404
    
    ancien_stock = ancien_stock[0]
    nouveau_stock = data['nouveau_stock']
    
    # Mettre à jour le stock
    cursor.execute("UPDATE produits SET stock = ? WHERE id = ?", (nouveau_stock, data['produit_id']))
    
    # Mettre à jour les variantes proportionnellement
    cursor.execute("UPDATE variantes SET quantite_stock = ? WHERE produit_id = ?", 
                  (nouveau_stock // 2, data['produit_id']))
    
    conn.commit()
    conn.close()
    
    event = {
        "produit_id": data['produit_id'],
        "ancien_stock": ancien_stock,
        "nouveau_stock": nouveau_stock,
        "variation": nouveau_stock - ancien_stock,
        "timestamp": timestamp,
        "raison": data.get('raison', 'Mise à jour manuelle')
    }
    
    try:
        envoyer_evenement("stock-mis-a-jour", event)
        return jsonify({"message": "Stock mis à jour", "event": event}), 200
    except Exception as e:
        return jsonify({'error': f'Erreur Kafka: {str(e)}'}), 500

@app.route('/panier/retirer', methods=['POST'])
def retirer_du_panier():
    """Retirer un article du panier et remettre le stock"""
    data = request.json
    timestamp = datetime.utcnow().isoformat()
    
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    produit_id = data.get('produit_id')
    quantite = data.get('quantite', 1)
    
    if not produit_id:
        conn.close()
        return jsonify({'error': 'produit_id requis'}), 400
    
    # Récupérer le stock actuel
    produit = cursor.execute(
        "SELECT stock, nom FROM produits WHERE id = ?",
        (produit_id,)
    ).fetchone()
    
    if not produit:
        conn.close()
        return jsonify({'error': 'Produit non trouvé'}), 404
    
    stock_actuel = produit[0]
    nom_produit = produit[1]
    
    # Incrémenter le stock
    nouveau_stock = stock_actuel + quantite
    cursor.execute(
        "UPDATE produits SET stock = ? WHERE id = ?",
        (nouveau_stock, produit_id)
    )
    conn.commit()
    conn.close()
    
    # Envoyer événement stock mis à jour
    stock_event = {
        "produit_id": produit_id,
        "ancien_stock": stock_actuel,
        "nouveau_stock": nouveau_stock,
        "raison": "retrait_panier",
        "timestamp": timestamp
    }
    
    try:
        envoyer_evenement("stock-mis-a-jour", stock_event)
    except Exception as e:
        print(f"⚠️ Erreur envoi événement stock: {e}")
    
    return jsonify({
        "message": "Article retiré du panier",
        "produit": nom_produit,
        "nouveau_stock": nouveau_stock
    }), 200

@app.route('/panier/vider', methods=['POST'])
def vider_panier():
    """Vider le panier et remettre tous les stocks"""
    data = request.json
    timestamp = datetime.utcnow().isoformat()
    articles = data.get('articles', [])
    
    if not articles:
        return jsonify({'message': 'Panier déjà vide'}), 200
    
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    stocks_mis_a_jour = []
    
    for article in articles:
        produit_id = article.get('id')
        quantite = article.get('quantite', 1)
        
        if not produit_id:
            continue
        
        # Récupérer le stock actuel
        produit = cursor.execute(
            "SELECT stock, nom FROM produits WHERE id = ?",
            (produit_id,)
        ).fetchone()
        
        if produit:
            stock_actuel = produit[0]
            nom_produit = produit[1]
            
            # Incrémenter le stock
            nouveau_stock = stock_actuel + quantite
            cursor.execute(
                "UPDATE produits SET stock = ? WHERE id = ?",
                (nouveau_stock, produit_id)
            )
            
            stocks_mis_a_jour.append({
                'produit_id': produit_id,
                'nom': nom_produit,
                'ancien_stock': stock_actuel,
                'nouveau_stock': nouveau_stock
            })
            
            # Envoyer événement stock mis à jour
            stock_event = {
                "produit_id": produit_id,
                "ancien_stock": stock_actuel,
                "nouveau_stock": nouveau_stock,
                "raison": "vidage_panier",
                "timestamp": timestamp
            }
            
            try:
                envoyer_evenement("stock-mis-a-jour", stock_event)
            except Exception as e:
                print(f"⚠️ Erreur envoi événement stock pour produit {produit_id}: {e}")
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": "Panier vidé",
        "stocks_restaures": len(stocks_mis_a_jour),
        "details": stocks_mis_a_jour
    }), 200

@app.route('/commande', methods=['POST'])
def passer_commande():
    data = request.json
    timestamp = datetime.utcnow().isoformat()

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    cursor.execute("INSERT INTO commandes (client_id, date_commande, total, statut) VALUES (?, ?, ?, ?)",
                   (data['client_id'], timestamp, data['total'], "validée"))
    commande_id = cursor.lastrowid

    for item in data['items']:
        cursor.execute("INSERT INTO commande_items (commande_id, variante_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?)",
                       (commande_id, item['variante_id'], item['quantite'], item['prix_unitaire']))
        cursor.execute("UPDATE variantes SET quantite_stock = quantite_stock - ? WHERE id = ?",
                       (item['quantite'], item['variante_id']))

    conn.commit()
    conn.close()

    event = {
        "id_commande": commande_id,
        "client_id": data["client_id"],
        "timestamp": timestamp,
        "total": data["total"],
        "items": data["items"]
    }
    envoyer_evenement("commande-validee", event)
    
    paiement_event = {
        "id_commande": commande_id,
        "client_id": data["client_id"],
        "montant": data["total"],
        "methode_paiement": data.get("methode_paiement", "carte_bancaire"),
        "statut": "accepte",
        "timestamp": timestamp,
        "transaction_id": f"TXN-{commande_id}-{timestamp.replace(':', '').replace('.', '')[:14]}"
    }
    envoyer_evenement("paiement-accepte", paiement_event)
    
    for item in data['items']:
        variante_info = conn = sqlite3.connect(DB)
        produit_id = conn.execute("SELECT produit_id FROM variantes WHERE id = ?", (item['variante_id'],)).fetchone()
        if produit_id:
            produit_id = produit_id[0]
            ancien_stock = conn.execute("SELECT stock FROM produits WHERE id = ?", (produit_id,)).fetchone()[0]
            nouveau_stock = ancien_stock - item['quantite']
            
            stock_event = {
                "produit_id": produit_id,
                "ancien_stock": ancien_stock,
                "nouveau_stock": max(0, nouveau_stock),
                "variation": -item['quantite'],
                "timestamp": datetime.utcnow().isoformat(),
                "raison": f"Commande #{commande_id}"
            }
            envoyer_evenement("stock-mis-a-jour", stock_event)
        conn.close()

    return jsonify({"message": "Commande envoyée à Kafka", "id_commande": commande_id, "paiement": paiement_event}), 201

# --- AUTHENTIFICATION ---

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    nom = data.get('nom')
    prenom = data.get('prenom', '')
    genre = data.get('genre', 'none')
    
    if not email or not password or not nom:
        return jsonify({'error': 'Email, mot de passe et nom requis'}), 400
    
    if genre not in ['homme', 'femme', 'none']:
        return jsonify({'error': 'Genre invalide'}), 400
    
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    # Vérifier si l'email existe déjà
    existing = cursor.execute("SELECT id FROM utilisateurs WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Email déjà utilisé'}), 409
    
    # Créer l'utilisateur
    password_hash = hash_password(password)
    cursor.execute(
        "INSERT INTO utilisateurs (email, password_hash, nom, prenom, genre) VALUES (?, ?, ?, ?, ?)",
        (email, password_hash, nom, prenom, genre)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Créer la session
    session['user_id'] = user_id
    session['email'] = email
    session['nom'] = nom
    
    return jsonify({
        'message': 'Utilisateur créé avec succès',
        'user': {'id': user_id, 'email': email, 'nom': nom, 'prenom': prenom, 'genre': genre}
    }), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    user = cursor.execute(
        "SELECT id, email, nom, prenom, genre, password_hash FROM utilisateurs WHERE email = ?",
        (email,)
    ).fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    user_id, user_email, nom, prenom, genre, stored_hash = user
    
    # Vérifier le mot de passe
    if hash_password(password) != stored_hash:
        conn.close()
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Mettre à jour la dernière connexion
    cursor.execute(
        "UPDATE utilisateurs SET derniere_connexion = ? WHERE id = ?",
        (datetime.utcnow().isoformat(), user_id)
    )
    conn.commit()
    conn.close()
    
    # Créer la session
    session['user_id'] = user_id
    session['email'] = user_email
    session['nom'] = nom
    
    return jsonify({
        'message': 'Connexion réussie',
        'user': {'id': user_id, 'email': user_email, 'nom': nom, 'prenom': prenom, 'genre': genre}
    }), 200

@app.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Déconnexion réussie'}), 200

@app.route('/auth/me', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    
    conn = sqlite3.connect(DB)
    user = conn.execute(
        "SELECT id, email, nom, prenom, genre FROM utilisateurs WHERE id = ?",
        (session['user_id'],)
    ).fetchone()
    conn.close()
    
    if not user:
        session.clear()
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    return jsonify({
        'user': {
            'id': user[0],
            'email': user[1],
            'nom': user[2],
            'prenom': user[3],
            'genre': user[4]
        }
    }), 200

# --- RECOMMANDATIONS ---

@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Obtenir des recommandations pour l'utilisateur connecté basées sur le genre"""
    if 'user_id' not in session:
        return jsonify({'error': 'Non authentifié'}), 401
    
    user_id = session['user_id']
    conn = sqlite3.connect(DB)
    
    # Récupérer le genre de l'utilisateur
    user_genre = conn.execute(
        "SELECT genre FROM utilisateurs WHERE id = ?",
        (user_id,)
    ).fetchone()
    
    if not user_genre:
        conn.close()
        return jsonify({'error': 'Utilisateur non trouvé'}), 404
    
    user_genre = user_genre[0]
    
    # Recommander les produits en fonction du genre de l'utilisateur
    # Si le genre est 'none', on recommande tout
    if user_genre == 'none':
        query = """
            SELECT p.id, p.nom, p.prix, p.stock, p.image_path, p.gender, COUNT(h.id) as nb_vues
            FROM produits p
            LEFT JOIN historique_consultations h ON p.id = h.produit_id AND h.utilisateur_id = ?
            GROUP BY p.id
            ORDER BY nb_vues DESC, p.id DESC
            LIMIT 20
        """
        produits = conn.execute(query, (user_id,)).fetchall()
    else:
        # Mapper homme -> Men, femme -> Women
        gender_mapping = {
            'homme': 'Men',
            'femme': 'Women'
        }
        target_gender = gender_mapping.get(user_genre, user_genre)
        
        query = """
            SELECT p.id, p.nom, p.prix, p.stock, p.image_path, p.gender, COUNT(h.id) as nb_vues
            FROM produits p
            LEFT JOIN historique_consultations h ON p.id = h.produit_id AND h.utilisateur_id = ?
            WHERE p.gender = ? OR p.gender = 'Unisex' OR p.gender IS NULL
            GROUP BY p.id
            ORDER BY nb_vues DESC, p.id DESC
            LIMIT 20
        """
        produits = conn.execute(query, (user_id, target_gender)).fetchall()
    
    conn.close()
    
    result = []
    for p in produits:
        prod_dict = {
            'id': p[0],
            'nom': p[1],
            'prix': p[2],
            'stock': p[3],
            'gender': p[5],
            'stock': p[3]
        }
        if p[4]:
            prod_dict['image_url'] = f"http://localhost:8000{p[4]}"
        else:
            prod_dict['image_url'] = f"https://picsum.photos/seed/{p[0]}/400/400"
        result.append(prod_dict)
    
    return jsonify(result)

@app.route('/filtres', methods=['GET'])
def get_filtres():
    """Récupérer les valeurs uniques pour tous les filtres"""
    conn = sqlite3.connect(DB)
    
    genders = [row[0] for row in conn.execute("SELECT DISTINCT gender FROM produits WHERE gender IS NOT NULL ORDER BY gender").fetchall()]
    colours = [row[0] for row in conn.execute("SELECT DISTINCT base_colour FROM produits WHERE base_colour IS NOT NULL ORDER BY base_colour").fetchall()]
    seasons = [row[0] for row in conn.execute("SELECT DISTINCT season FROM produits WHERE season IS NOT NULL ORDER BY season").fetchall()]
    usages = [row[0] for row in conn.execute("SELECT DISTINCT usage FROM produits WHERE usage IS NOT NULL ORDER BY usage").fetchall()]
    categories = [row[0] for row in conn.execute("SELECT DISTINCT nom FROM categories ORDER BY nom").fetchall()]
    
    conn.close()
    
    return jsonify({
        'genders': genders,
        'colours': colours,
        'seasons': seasons,
        'usages': usages,
        'categories': categories
    })

@app.route('/top-produits-consultes', methods=['GET'])
def get_top_produits_consultes():
    """Récupérer les 5 produits les plus consultés (temps réel)"""
    conn = sqlite3.connect(DB)
    
    query = """
        SELECT p.id, p.nom, p.prix, p.image_path, COUNT(h.id) as nb_consultations
        FROM historique_consultations h
        JOIN produits p ON h.produit_id = p.id
        WHERE h.timestamp >= datetime('now', '-1 hour')
        GROUP BY p.id
        ORDER BY nb_consultations DESC, p.id DESC
        LIMIT 5
    """
    
    produits = conn.execute(query).fetchall()
    conn.close()
    
    result = []
    for p in produits:
        prod_dict = {
            'id': p[0],
            'nom': p[1],
            'prix': p[2],
            'nb_consultations': p[4]
        }
        if p[3]:
            prod_dict['image_url'] = f"http://localhost:8000{p[3]}"
        else:
            prod_dict['image_url'] = f"https://picsum.photos/seed/{p[0]}/400/400"
        result.append(prod_dict)
    
    return jsonify(result)

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    """Servir les images du dataset"""
    return send_from_directory('static/images', filename)

if __name__ == '__main__':
    init_db()
    app.run(host="0.0.0.0", port=5000)
