-- Catégories de produits
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  description TEXT
);

-- Produits
CREATE TABLE produits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  description TEXT,
  prix DECIMAL(10,2) NOT NULL,
  categorie_id INTEGER,
  stock INTEGER NOT NULL,
  image_path TEXT,
  gender TEXT,
  base_colour TEXT,
  season TEXT,
  usage TEXT,
  article_type TEXT,
  FOREIGN KEY (categorie_id) REFERENCES categories(id)
);

-- Variantes du produit (taille, couleur)
CREATE TABLE variantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER NOT NULL,
  taille TEXT,
  couleur TEXT,
  quantite_stock INTEGER NOT NULL,
  prix_variant DECIMAL(10,2),
  FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Clients
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  adresse TEXT
);

-- Utilisateurs (pour l'authentification)
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT,
  genre TEXT CHECK(genre IN ('homme', 'femme', 'none')) DEFAULT 'none',
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion DATETIME
);

-- Historique des consultations (pour recommandations Spark)
CREATE TABLE IF NOT EXISTS historique_consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL,
  produit_id INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),
  FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- Commandes
CREATE TABLE commandes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  date_commande DATETIME NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  statut TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Détails des commandes
CREATE TABLE commande_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  commande_id INTEGER NOT NULL,
  variante_id INTEGER NOT NULL,
  quantite INTEGER NOT NULL,
  prix_unitaire DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (commande_id) REFERENCES commandes(id),
  FOREIGN KEY (variante_id) REFERENCES variantes(id)
);
