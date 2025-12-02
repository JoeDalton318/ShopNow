# Rendu 2 : Journal Technique - Spécialiste Kafka

**Nom :** [Votre Nom]
**Rôle :** Spécialiste Kafka

---

## 1. Ma Place dans l'Architecture

Dans l'écosystème ShopNow+, Kafka est le **pivot central du flux de données**, le "bus d'événements" qui connecte toutes les briques applicatives.

**Flux de données :**
Frontend → Backend → **Kafka** → Consumer (vers HDFS) → Spark

Mon rôle est de garantir que chaque action métier (consultation produit, ajout au panier, commande, etc.) est transformée en un événement fiable, transporté et mis à disposition des autres services en temps réel.

---

## 2. Conception et Organisation des Topics Kafka

La base de mon travail a été de structurer les flux de données en **topics métier** distincts. Cette séparation est essentielle pour la clarté, la maintenance et la capacité d'analyse.

J'ai défini 5 topics principaux :
-   `produit-consulte`
-   `article-ajoute`
-   `commande-validee`
-   `paiement-accepte`
-   `stock-mis-a-jour`

La création de ces topics est automatisée au démarrage du broker Kafka grâce à la configuration dans `docker-compose.yml`.

**Extrait de `docker-compose.yml` :**
```yaml
services:
  kafka:
    image: wurstmeister/kafka
    # ... autres configurations
    environment:
      # ...
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_CREATE_TOPICS: >
        commande-validee:1:1,
        produit-consulte:1:1,
        article-ajoute:1:1,
        paiement-accepte:1:1,
        stock-mis-a-jour:1:1
```
Cette configuration `nom-topic:partitions:replication-factor` garantit que tous les topics nécessaires sont disponibles dès le lancement de la plateforme.

---

## 3. Production d'Événements depuis le Backend

Pour que le système soit réactif, chaque action métier dans le backend doit immédiatement produire un événement. J'ai développé un module `kafka_producer.py` qui fournit une interface simple et robuste pour cela.

- **Connexion Fiable :** Le producer tente de se connecter à Kafka plusieurs fois au démarrage, ce qui le rend résilient aux démarrages décalés des services dans Docker.
- **Sérialisation JSON :** Tous les événements sont sérialisés au format JSON avant d'être envoyés.

**Extrait de `backend/kafka_producer.py` :**
```python
from kafka import KafkaProducer
import json
import time

KAFKA_BROKER = "kafka:9092"

def create_kafka_producer():
    # Boucle de tentatives de connexion
    for i in range(MAX_RETRIES):
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BROKER,
                value_serializer=lambda v: json.dumps(v).encode("utf-8")
            )
            print("✅ Kafka connecté")
            return producer
        except Exception as e:
            # ... gestion d'erreur
    raise Exception("⛔ Kafka indisponible")

producer = create_kafka_producer()

def envoyer_evenement(topic, data):
    try:
        # Envoi asynchrone de l'événement
        future = producer.send(topic, data)
        # Attente de la confirmation du broker pour garantir la livraison
        result = future.get(timeout=30)
        print(f"✅ {topic} : {data.get('id_commande', data.get('id_produit', ''))}")
        return result
    except Exception as e:
        print(f"❌ Erreur envoi {topic}: {e}")
        raise
```
Cette fonction `envoyer_evenement` est ensuite appelée dans tout le backend (`app.py`) aux moments clés, par exemple lors de l'ajout d'un article au panier.

*Capture d'écran à insérer : Logs du backend montrant la confirmation d'envoi d'un événement à Kafka (ex: "✅ produit-consulte : 1597").*

---

## 4. Partitionnement et Clé de Partition

Pour optimiser la performance et garantir l'ordre des messages pour une même entité (par exemple, toutes les actions sur un même produit), j'ai prévu la possibilité d'utiliser des **clés de partition**.

- **Principe :** Kafka garantit que tous les messages envoyés avec la même clé de partition arriveront dans la même partition et seront donc consommés dans l'ordre d'envoi.
- **Application :**
    - Pour les événements liés aux produits (`produit-consulte`, `stock-mis-a-jour`), la clé de partition est `id_produit`.
    - Pour les événements de commande (`commande-validee`), la clé est `id_commande`.

Bien que le code du producer actuel n'implémente pas l'envoi explicite de la clé, l'architecture est prête pour cette optimisation. Il suffirait de passer le paramètre `key` à la méthode `producer.send()`.

---

## 5. Commandes de Validation et de Monitoring

Pour m'assurer du bon fonctionnement de Kafka, j'utilise régulièrement les outils en ligne de commande fournis par l'image Docker.

**1. Vérifier la création des topics :**
```powershell
docker exec shopnow-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
```
*Réponse attendue :* La liste des 5 topics créés (`produit-consulte`, `article-ajoute`, etc.).

**2. Inspecter les messages d'un topic en temps réel :**
(Exemple avec `produit-consulte`)
```powershell
docker exec shopnow-kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic produit-consulte --from-beginning --max-messages 2
```
*Réponse attendue :* Les deux derniers messages JSON envoyés sur ce topic, confirmant que le flux de données est bien actif.

*Capture d'écran à insérer : Terminal affichant le résultat de la commande `kafka-console-consumer.sh` avec des messages JSON visibles.*

### Exemple de Données (JSON)

Voici un exemple de message qui transite par le topic `produit-consulte`. C'est ce format structuré qui permet aux services en aval (comme Spark) de l'interpréter facilement.

```json
{
    "id_produit": 1597,
    "nom_produit": "T-shirt en coton bio",
    "prix": 29.99,
    "timestamp": "2025-11-28T10:30:00Z",
    "user_id": 123
}
```

**3. Vérifier la santé du broker :**
Cette vérification se fait principalement en observant les logs et en s'assurant que les producers et consumers peuvent se connecter sans erreur.

---

## 6. Fiabilité et Impact Métier

Mon rôle garantit la **fiabilité de la transmission de données**. Kafka agit comme un tampon (buffer) : si un service consommateur (comme le script qui écrit dans HDFS) tombe en panne, les messages ne sont pas perdus. Ils sont conservés dans les topics jusqu'à ce que le service redémarre et reprenne sa consommation.

**Impact métier :**
- **Traçabilité complète :** Chaque action client est capturée, ce qui est essentiel pour l'analyse de comportement.
- **Découplage des services :** Le backend n'a pas besoin de savoir qui va consommer les données. Il les envoie à Kafka, et c'est tout. Cela rend le système très flexible pour ajouter de nouveaux services d'analyse à l'avenir.
- **Réactivité :** L'architecture événementielle permet une réaction quasi-instantanée aux actions des utilisateurs, que ce soit pour mettre à jour des statistiques ou déclencher des alertes.

---

## 7. Conclusion

En tant que spécialiste Kafka, j'ai mis en place le système nerveux de l'application ShopNow+. Ce bus d'événements robuste et scalable est la fondation qui permet à la fois au backend d'être réactif et à la partie Big Data (HDFS/Spark) de disposer d'un flux de données fiable et en temps réel. C'est un élément indispensable pour faire de ShopNow+ une plateforme e-commerce moderne et "data-driven".
