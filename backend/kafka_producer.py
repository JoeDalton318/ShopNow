from kafka import KafkaProducer
import json
import time

KAFKA_BROKER = "kafka:9092"
MAX_RETRIES = 5
DELAY_SECS = 5

def create_kafka_producer():
    for i in range(MAX_RETRIES):
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BROKER,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                request_timeout_ms=30000,
                max_block_ms=30000
            )
            print("✅ Kafka connecté")
            return producer
        except Exception as e:
            print(f"❌ Tentative {i+1}/{MAX_RETRIES} : {e}")
            time.sleep(DELAY_SECS)
    raise Exception("⛔ Kafka indisponible")

producer = create_kafka_producer()

def envoyer_evenement(topic, data):
    try:
        future = producer.send(topic, data)
        result = future.get(timeout=30)
        print(f"✅ {topic} : {data.get('id_commande', data.get('id_produit', ''))}")
        return result
    except Exception as e:
        print(f"❌ Erreur envoi {topic}: {e}")
        raise
