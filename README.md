# 🛒 ShopNow+ : Plateforme E-commerce Big Data

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)
[![Kafka](https://img.shields.io/badge/Apache%20Kafka-3.0+-black.svg)](https://kafka.apache.org/)
[![Spark](https://img.shields.io/badge/Apache%20Spark-3.5+-E25A1C.svg)](https://spark.apache.org/)
[![Hadoop](https://img.shields.io/badge/Hadoop%20HDFS-3.2+-yellow.svg)](https://hadoop.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ShopNow+** est une plateforme e-commerce complète construite sur une architecture Big Data moderne. Le projet démontre l'intégration d'un frontend React, d'un backend Flask, d'Apache Kafka pour la gestion d'événements en temps réel, de HDFS pour le stockage distribué et de Spark Streaming pour l'analyse en temps réel.

---

## 📋 Table des matières

- [Architecture](#-architecture)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Équipe](#-équipe-groupe-6)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Tests et Validation](#-tests-et-validation)
- [Structure du Projet](#-structure-du-projet)
- [Flux de Données](#-flux-de-données)
- [Arrêt](#-arrêt)
- [Licence](#-licence)

---

## 🏛️ Architecture

L'application est conçue autour d'une architecture microservices orchestrée par Docker Compose :

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │─────▶│   Backend   │─────▶│    Kafka    │
│   (React)   │      │   (Flask)   │      │   (Broker)  │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                            ┌─────────────────────┼─────────────────────┐
                            ▼                     ▼                     ▼
                     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                     │   Consumer  │      │    Spark    │      │    HDFS     │
                     │    HDFS     │      │  Streaming  │      │  (Storage)  │
                     └─────────────┘      └─────────────┘      └─────────────┘
```

### Flux de données :

1. **Frontend (React)** : Interface utilisateur où les clients naviguent et passent commandes
2. **Backend (Flask)** : API REST qui gère la logique métier et produit des événements
3. **Kafka** : Message broker qui transporte les événements de manière asynchrone
4. **Consumer HDFS** : Service Python qui archive tous les événements dans HDFS
5. **Spark Streaming** : Analyse les événements en temps réel pour générer des KPIs
6. **HDFS** : Data Lake pour l'archivage long terme des événements

---

## ✨ Fonctionnalités

### 🛍️ E-commerce
- Navigation dans un catalogue de produits avec filtres avancés
- Système de panier dynamique
- Authentification et gestion de profil utilisateur
- Recommandations personnalisées

### 📊 Big Data & Analytics
- **5 événements métier** capturés en temps réel :
  - `produit-consulte` : Consultation d'un produit
  - `article-ajoute` : Ajout au panier
  - `commande-validee` : Validation d'une commande
  - `paiement-accepte` : Paiement accepté
  - `stock-mis-a-jour` : Mise à jour du stock

- **Analyses temps réel (Spark Streaming)** :
  - Top 10 des produits les plus consultés (fenêtre glissante 10 min)
  - Chiffre d'affaires en temps réel (fenêtre 5 min)
  - Produits les plus ajoutés au panier
  - Alertes de rupture de stock (stock < 10)

- **Stockage distribué (HDFS)** :
  - Archivage automatique de tous les événements
  - Organisation par topic et par date
  - Mécanisme de fallback local en cas d'indisponibilité

---

## 💻 Technologies

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Frontend** | React, React Router, Axios | 18.x |
| **Backend** | Flask, SQLite | Python 3.9+ |
| **Message Broker** | Apache Kafka, Zookeeper | Wurstmeister |
| **Stockage** | Hadoop HDFS | 3.2.1 |
| **Analyse** | Apache Spark (PySpark) | 3.5.x |
| **Orchestration** | Docker, Docker Compose | - |

---

## 👥 Équipe (Groupe 6)

- **Gills Daryl KETCHA NZOUNDJI J.** - Spécialiste Kafka & Backend
- **Narcisse Cabrel TSAFACK FOUEGAP** - Spécialiste Frontend & Architecture Client
- **Frédéric FERNADES DA COSTA** - Spécialiste Spark & HDFS

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Docker** (version 20.x ou supérieure)
- **Docker Compose** (version 2.x ou supérieure)
- **Python 3.9+** (pour le script d'importation du dataset)
- **pip** (gestionnaire de paquets Python)

### Vérification des prérequis

```powershell
# Vérifier Docker
docker --version

# Vérifier Docker Compose
docker-compose --version

# Vérifier Python
python --version
```

---

## 🚀 Installation

### Étape 1 : Cloner le projet

```powershell
git clone https://github.com/JoeDalton318/ShopNow.git
cd ShopNow
```

### Étape 2 : Télécharger et importer le dataset

Le projet utilise un dataset de produits. Avant de lancer les conteneurs, vous devez initialiser la base de données.

```powershell
# Créer un environnement virtuel Python (recommandé)
python -m venv .venv

# Activer l'environnement virtuel
.venv\Scripts\Activate.ps1

# Installer les dépendances du backend
pip install -r backend/requirements.txt

# Lancer le script d'importation du dataset
cd backend
python import_dataset.py
```

**Ce que fait ce script :**
- Télécharge le dataset depuis Kaggle (si configuré) ou utilise un dataset local
- Crée la base de données SQLite `database.db`
- Initialise les tables via `schema.sql`
- Insère les produits et catégories

> **Note :** Si vous n'avez pas configuré Kaggle API, le script utilisera un dataset de démonstration ou vous demandera de placer manuellement le fichier CSV.

### Étape 3 : Lancer l'architecture Docker

Retournez à la racine du projet et lancez tous les services :

```powershell
cd ..
docker-compose up -d --build
```

**Temps d'attente :** La première fois, le téléchargement des images et la construction des conteneurs peuvent prendre 5-10 minutes. Attendez environ 30 secondes après le lancement pour que tous les services soient initialisés.

### Étape 4 : Vérifier que tous les conteneurs sont actifs

```powershell
docker ps
```

Vous devriez voir 8 conteneurs en cours d'exécution :
- `frontend`
- `backend`
- `kafka`
- `zookeeper`
- `kafka-consumer`
- `spark`
- `namenode` (HDFS)
- `datanode` (HDFS)

---

## 🌐 Utilisation

Une fois tous les conteneurs démarrés, les services suivants sont accessibles :

| Service | URL | Description |
|---------|-----|-------------|
| **Site Web (Frontend)** | [http://localhost:3000](http://localhost:3000) | Interface utilisateur e-commerce |
| **API Backend** | [http://localhost:8000](http://localhost:8000) | API REST (ex: `/produits`) |
| **HDFS NameNode UI** | [http://localhost:9870](http://localhost:9870) | Interface de gestion HDFS |
| **Kafka Broker** | `localhost:9092` | Pour connexion client Kafka |
| **Zookeeper** | `localhost:2181` | Coordination Kafka |

### Naviguer sur le site

1. Ouvrez votre navigateur à [http://localhost:3000](http://localhost:3000)
2. Naviguez dans le catalogue, consultez des produits
3. Créez un compte ou connectez-vous
4. Ajoutez des articles au panier
5. Validez une commande

**Chaque action génère des événements** qui sont capturés par Kafka, archivés dans HDFS et analysés par Spark en temps réel.

---

## 🧪 Tests et Validation

### 1. Vérifier les analyses Spark en temps réel

Consultez les logs du conteneur Spark pour voir les tableaux de bord mis à jour :

```powershell
docker logs shopnow_project_20251122-spark-1 --tail 100
```

**Résultat attendu :** Tableaux affichant les top produits, le CA temps réel, les alertes stock, etc.

### 2. Inspecter les messages Kafka

Lire les 5 premiers messages du topic `produit-consulte` :

```powershell
docker exec shopnow-kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic produit-consulte --from-beginning --max-messages 5
```

**Résultat attendu :** Messages JSON avec `id_produit`, `nom_produit`, `timestamp`, `prix`, `user_id`.

### 3. Lister les topics Kafka

```powershell
docker exec shopnow-kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```

**Résultat attendu :** Liste des 5 topics :
- `article-ajoute`
- `commande-validee`
- `paiement-accepte`
- `produit-consulte`
- `stock-mis-a-jour`

### 4. Explorer les fichiers dans HDFS

Lister l'arborescence complète des événements stockés :

```powershell
docker exec namenode hdfs dfs -ls -R /shopnow/events
```

**Résultat attendu :** Arborescence organisée par topic et par date.

### 5. Lire le contenu d'un fichier HDFS

Afficher les 5 premières lignes d'un fichier d'événements :

```powershell
docker exec namenode hdfs dfs -cat /shopnow/events/produit-consulte/2025-12-02.json | Select-Object -First 5
```

**Résultat attendu :** Lignes JSON (newline-delimited), une par événement.

### 6. Vérifier les logs du consumer HDFS

```powershell
docker logs shopnow_project_20251122-kafka-consumer-1 --tail 20
```

**Résultat attendu :** Lignes confirmant l'écriture sur HDFS ou le backup local.

### 7. Filtrer les alertes de stock dans Spark

```powershell
docker logs shopnow_project_20251122-spark-1 --tail 50 | Select-String "ALERTE"
```

**Résultat attendu :** Messages d'alerte si un stock est bas (`nouveau_stock < 10`).

### 8. Tester l'API Backend

```powershell
# Lister tous les produits
Invoke-RestMethod -Uri http://localhost:8000/produits -Method GET

# Obtenir un produit spécifique
Invoke-RestMethod -Uri http://localhost:8000/produits/1234 -Method GET
```

---

## 📁 Structure du Projet

```
ShopNow/
├── backend/
│   ├── app.py                  # Application Flask (API REST)
│   ├── kafka_producer.py       # Module d'envoi d'événements Kafka
│   ├── import_dataset.py       # Script d'importation du dataset
│   ├── schema.sql              # Schéma de la base de données
│   ├── requirements.txt        # Dépendances Python
│   ├── Dockerfile              # Image Docker du backend
│   └── static/images/          # Images des produits
├── frontend/
│   ├── src/
│   │   ├── components/         # Composants React réutilisables
│   │   ├── pages/              # Pages de l'application
│   │   ├── context/            # Contexts React (Auth, Panier, Theme)
│   │   ├── hooks/              # Hooks personnalisés
│   │   └── api.js              # Client Axios pour l'API
│   ├── public/                 # Fichiers statiques
│   ├── package.json            # Dépendances Node.js
│   └── Dockerfile              # Image Docker du frontend
├── kafka/
│   ├── consumer_multi_topics.py # Consumer Python vers HDFS
│   └── Dockerfile              # Image Docker du consumer
├── spark/
│   ├── spark_streaming_realtime.py # Application Spark Streaming
│   └── Dockerfile              # Image Docker de Spark
├── docker-compose.yml          # Orchestration de tous les services
├── .gitignore                  # Fichiers ignorés par Git
├── LICENSE                     # Licence MIT
└── README.md                   # Ce fichier
```

---

## 🔄 Flux de Données

### Exemple : Consultation d'un produit

1. **Client** : Clique sur un produit dans le catalogue (Frontend React)
2. **Frontend** : Envoie `GET /produits/:id` au Backend
3. **Backend** : 
   - Récupère le produit en base SQLite
   - Enregistre l'historique de consultation
   - Envoie un événement `produit-consulte` à Kafka
4. **Kafka** : Distribue l'événement aux consumers abonnés
5. **Consumer HDFS** : Archive l'événement dans `/shopnow/events/produit-consulte/{date}.json`
6. **Spark Streaming** : Analyse l'événement et met à jour le "Top 10 produits consultés"
7. **Frontend** : Affiche les détails du produit au client

### Formats de données

- **API REST** : JSON
- **Kafka** : JSON (sérialisé UTF-8)
- **HDFS** : JSON newline-delimited (1 événement par ligne)
- **Spark** : DataFrames (en mémoire)

---

## 🛑 Arrêt

Pour arrêter tous les conteneurs sans supprimer les données :

```powershell
docker-compose stop
```

Pour arrêter et supprimer tous les conteneurs, réseaux et volumes :

```powershell
docker-compose down
```

Pour tout supprimer y compris les volumes (⚠️ perte de données HDFS) :

```powershell
docker-compose down -v
```

---

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- Dataset fashion products inspiré de Kaggle
- Architecture basée sur les bonnes pratiques Big Data

---

## 📞 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

**Développé avec ❤️ par le Groupe 6**
