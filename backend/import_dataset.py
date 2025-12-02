"""
Script pour télécharger et importer le dataset Fashion Product Images de Kaggle
Dataset: https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-small
"""
import kagglehub
import pandas as pd
import sqlite3
import os
import json
import shutil
from pathlib import Path

# Télécharger le dataset
print("📥 Téléchargement du dataset Fashion Product Images...")
dataset_path = kagglehub.dataset_download("paramaggarwal/fashion-product-images-small")
print(f"✅ Dataset téléchargé dans : {dataset_path}")

# Créer le dossier static/images pour les images
STATIC_IMAGES_DIR = "static/images"
os.makedirs(STATIC_IMAGES_DIR, exist_ok=True)
print(f"📁 Dossier images créé : {STATIC_IMAGES_DIR}")

# Trouver le dossier images dans le dataset
images_source_dir = None
for root, dirs, files in os.walk(dataset_path):
    if 'images' in dirs:
        images_source_dir = os.path.join(root, 'images')
        break

if images_source_dir:
    print(f"📷 Dossier images trouvé : {images_source_dir}")
else:
    print("⚠️ Dossier images non trouvé dans le dataset")

# Charger les données
csv_file = os.path.join(dataset_path, "styles.csv")
if not os.path.exists(csv_file):
    # Chercher récursivement
    csv_files = list(Path(dataset_path).rglob("*.csv"))
    if csv_files:
        csv_file = str(csv_files[0])
        print(f"📄 Fichier CSV trouvé : {csv_file}")
    else:
        raise FileNotFoundError("Fichier styles.csv introuvable")

print(f"📊 Chargement des données depuis {csv_file}...")
df = pd.read_csv(csv_file, on_bad_lines='skip')
print(f"✅ {len(df)} produits chargés")

# Afficher les colonnes disponibles
print(f"\n📋 Colonnes disponibles : {list(df.columns)}")
print(f"\n🔍 Aperçu des données :")
print(df.head())

# Connexion à la base SQLite
DB_PATH = "database.db"
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Vider les tables existantes
print("\n🗑️ Nettoyage des tables existantes...")
cursor.execute("DELETE FROM commande_items")
cursor.execute("DELETE FROM commandes")
cursor.execute("DELETE FROM variantes")
cursor.execute("DELETE FROM produits")
cursor.execute("DELETE FROM categories")
cursor.execute("DELETE FROM clients")

# Créer les catégories uniques
print("\n📁 Création des catégories...")
categories = df['masterCategory'].dropna().unique()[:10]  # Top 10 catégories
category_mapping = {}

for idx, cat in enumerate(categories, 1):
    cursor.execute(
        "INSERT INTO categories (id, nom, description) VALUES (?, ?, ?)",
        (idx, cat, f"Catégorie {cat}")
    )
    category_mapping[cat] = idx

conn.commit()
print(f"✅ {len(categories)} catégories créées")

# Importer les produits (limiter à 100 pour ne pas surcharger)
print("\n🛍️ Import des produits...")
products_added = 0
variants_added = 0

for idx, row in df.head(100).iterrows():
    try:
        product_id = int(row['id']) if pd.notna(row['id']) else idx + 1
        product_name = row['productDisplayName'] if pd.notna(row['productDisplayName']) else f"Produit {product_id}"
        
        # Prix aléatoire basé sur le type
        base_price = 29.99
        if pd.notna(row['masterCategory']):
            if 'Watch' in str(row['masterCategory']):
                base_price = 149.99
            elif 'Shoe' in str(row['masterCategory']):
                base_price = 79.99
            elif 'Bag' in str(row['masterCategory']):
                base_price = 59.99
        
        category_id = category_mapping.get(row['masterCategory'], 1) if pd.notna(row['masterCategory']) else 1
        
        # Description
        desc_parts = []
        if pd.notna(row['gender']):
            desc_parts.append(f"Genre: {row['gender']}")
        if pd.notna(row['baseColour']):
            desc_parts.append(f"Couleur: {row['baseColour']}")
        if pd.notna(row['season']):
            desc_parts.append(f"Saison: {row['season']}")
        if pd.notna(row['usage']):
            desc_parts.append(f"Usage: {row['usage']}")
        
        description = " | ".join(desc_parts) if desc_parts else product_name
        
        stock = 50  # Stock par défaut
        
        # Copier l'image si elle existe
        image_path = None
        if images_source_dir:
            source_image = os.path.join(images_source_dir, f"{product_id}.jpg")
            if os.path.exists(source_image):
                dest_image = os.path.join(STATIC_IMAGES_DIR, f"{product_id}.jpg")
                try:
                    shutil.copy2(source_image, dest_image)
                    image_path = f"/static/images/{product_id}.jpg"
                except Exception as e:
                    print(f"⚠️ Erreur copie image {product_id}: {e}")
        
        # Insérer le produit
        gender = str(row['gender']) if pd.notna(row['gender']) else None
        base_colour = str(row['baseColour']) if pd.notna(row['baseColour']) else None
        season = str(row['season']) if pd.notna(row['season']) else None
        usage = str(row['usage']) if pd.notna(row['usage']) else None
        article_type = str(row['articleType']) if pd.notna(row['articleType']) else None
        
        cursor.execute(
            """INSERT OR REPLACE INTO produits 
            (id, nom, description, prix, categorie_id, stock, image_path, gender, base_colour, season, usage, article_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (product_id, product_name[:100], description[:200], base_price, category_id, stock, image_path,
             gender, base_colour, season, usage, article_type)
        )
        products_added += 1
        
        # Créer 2-3 variantes par produit
        colors = [row['baseColour']] if pd.notna(row['baseColour']) else ['Standard']
        sizes = ['S', 'M', 'L'] if pd.notna(row['gender']) and row['gender'] in ['Men', 'Women', 'Unisex'] else ['One Size']
        
        for color in colors[:1]:  # 1 couleur
            for size in sizes[:2]:  # 2 tailles
                cursor.execute(
                    "INSERT INTO variantes (produit_id, taille, couleur, quantite_stock, prix_variant) VALUES (?, ?, ?, ?, ?)",
                    (product_id, size, color, stock // 2, base_price)
                )
                variants_added += 1
        
    except Exception as e:
        print(f"⚠️ Erreur pour le produit {idx}: {e}")
        continue

# Ajouter les clients de test
print("\n👥 Création des clients...")
clients = [
    (1, "Alice Dupont", "alice.dupont@email.com", "123 Rue de la Mode, Paris"),
    (2, "Bob Martin", "bob.martin@email.com", "456 Avenue Style, Lyon"),
    (3, "Charlie Bernard", "charlie.b@email.com", "789 Boulevard Fashion, Marseille"),
]

for client in clients:
    cursor.execute(
        "INSERT OR REPLACE INTO clients (id, nom, email, adresse) VALUES (?, ?, ?, ?)",
        client
    )

conn.commit()
conn.close()

print(f"\n✅ Import terminé !")
print(f"   - {products_added} produits importés")
print(f"   - {variants_added} variantes créées")
print(f"   - {len(categories)} catégories")
print(f"   - {len(clients)} clients")

print(f"\n📊 Base de données mise à jour : {DB_PATH}")
print(f"\n🎯 Vous pouvez maintenant tester l'API sur http://localhost:5000/produits")
