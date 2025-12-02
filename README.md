# ShopNow+ - Plateforme e-commerce Big Data

Plateforme e-commerce complète avec pipeline Big Data pour l'analyse en temps réel.

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────┐      ┌────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│  Kafka │─────▶│   Spark    │
│   React     │      │   Flask      │      │        │      │ Streaming  │
└─────────────┘      └──────────────┘      └────────┘      └────────────┘
                                                 │                │
                                                 ▼                │
                                          ┌──────────┐            │
                                          │ Consumer │            │
                                          │  + HDFS  │◀───────────┘
                                          └──────────┘
```

## 📦 Composants

### Frontend (React)
- Catalogue produits avec filtres avancés
- Gestion panier et commandes
- Authentification utilisateur
- Système de recommandations

### Backend (Flask)
- API REST pour produits, stocks, commandes
- Producteur Kafka pour événements métier
- Base SQLite avec dataset Fashion

### Kafka
- 5 topics : `produit-consulte`, `article-ajoute`, `commande-validee`, `paiement-accepte`, `stock-mis-a-jour`
- Consumer multi-topics vers HDFS

### HDFS
- Stockage événements bruts en JSON
- Organisation par topic et date

### Spark Streaming (PySpark)
- **Mode**: Streaming temps réel avec Kafka
- TOP produits consultés (fenêtre 10min)
- Chiffre d'affaires en temps réel (fenêtre 5min)
- Produits ajoutés au panier (fenêtre 10min)
- Alertes rupture de stock instantanées

## 🚀 Démarrage

```bash
# Lancer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Accès services
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - HDFS NameNode: http://localhost:9870
```

## 📊 Événements métier

| Événement | Déclencheur | Utilité |
|-----------|-------------|---------|
| `produit-consulte` | Consultation fiche produit | Analyse popularité |
| `article-ajoute` | Ajout au panier | Tracking conversions |
| `commande-validee` | Validation commande | CA et statistiques |
| `paiement-accepte` | Paiement réussi | Transactions |
| `stock-mis-a-jour` | Modification stock | Alertes rupture |

## 🔧 Tests Spark Streaming

Les analyses Spark en temps réel incluent :

- ✅ TOP 10 produits consultés (fenêtre 10 min)
- ✅ Chiffre d'affaires en temps réel (fenêtre 5 min)
- ✅ TOP 10 produits au panier (fenêtre 10 min)
- ✅ Alertes rupture de stock instantanées

**Architecture:** Spark lit directement depuis Kafka avec `readStream()` et traite les événements en continu avec fenêtres temporelles et watermarks.

## 📁 Structure

```text
.
├── backend/          # API Flask + Kafka producer
├── frontend/         # Application React
├── kafka/            # Consumer multi-topics
├── spark/            # Jobs Spark Streaming
└── docker-compose.yml
```

## 🛠️ Technologies

- **Frontend**: React 18, Context API, Hooks
- **Backend**: Flask, SQLite, Kafka-Python
- **Streaming**: Apache Kafka
- **Storage**: HDFS (Hadoop 3.2.1)
- **Analytics**: Apache Spark 3.5.0 (PySpark)
- **Orchestration**: Docker Compose
