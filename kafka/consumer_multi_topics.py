from kafka import KafkaConsumer
import json
import os
from datetime import datetime
import time
import requests
import sys

sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', buffering=1)
sys.stderr = os.fdopen(sys.stderr.fileno(), 'w', buffering=1)

TOPICS = [
    "commande-validee",
    "produit-consulte", 
    "article-ajoute",
    "paiement-accepte",
    "stock-mis-a-jour"
]
HDFS_NAMENODE = "http://namenode:9870"
HDFS_BASE_PATH = "/shopnow/events"
KAFKA_BROKER = "kafka:9092"
MAX_RETRIES = 10
DELAY_SECS = 5

def create_kafka_consumer():
    for i in range(MAX_RETRIES):
        try:
            consumer = KafkaConsumer(
                *TOPICS,
                bootstrap_servers=KAFKA_BROKER,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest',
                group_id='hdfs-consumer-group',
                enable_auto_commit=True
            )
            print(f"✅ Consumer connecté à Kafka sur {KAFKA_BROKER}")
            print(f"📡 Topics: {', '.join(TOPICS)}")
            return consumer
        except Exception as e:
            print(f"❌ Tentative {i+1}/{MAX_RETRIES}: {e}")
            time.sleep(DELAY_SECS)
    raise Exception("⛔ Kafka indisponible")

def write_to_hdfs(path, data):
    max_attempts = 3
    
    for attempt in range(max_attempts):
        try:
            parent_dir = '/'.join(path.split('/')[:-1])
            if parent_dir:
                mkdir_url = f"{HDFS_NAMENODE}/webhdfs/v1{parent_dir}?op=MKDIRS&user.name=root"
                requests.put(mkdir_url, allow_redirects=True, timeout=5)
            
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
            base_name = path.rsplit('.', 1)[0]
            unique_path = f"{base_name}_{timestamp}.json"
            
            url_create = f"{HDFS_NAMENODE}/webhdfs/v1{unique_path}?op=CREATE&user.name=root&overwrite=true"
            response = requests.put(url_create, data=data, allow_redirects=True, timeout=10)
            
            success = response.status_code in [200, 201]
            if success:
                return True
            
            if attempt < max_attempts - 1:
                time.sleep(0.5 * (attempt + 1))
                
        except Exception as e:
            if attempt == max_attempts - 1:
                print(f"⚠️ Erreur HDFS: {e}")
    
    return False

def write_to_local_backup(topic, data):
    try:
        backup_dir = f"/app/output/{topic}"
        os.makedirs(backup_dir, exist_ok=True)
        date_str = datetime.utcnow().strftime('%Y-%m-%d')
        backup_file = f"{backup_dir}/{date_str}.json"
        
        with open(backup_file, "a") as f:
            f.write(data)
        return True
    except Exception as e:
        print(f"⚠️ Erreur sauvegarde locale: {e}")
        return False

consumer = create_kafka_consumer()

print(f"\n🎧 Écoute des événements Kafka...")
print(f"📂 Destination: HDFS {HDFS_NAMENODE}{HDFS_BASE_PATH}")

event_count = {topic: 0 for topic in TOPICS}
emoji_map = {
    "commande-validee": "🛒",
    "produit-consulte": "👁️",
    "article-ajoute": "➕",
    "paiement-accepte": "💳",
    "stock-mis-a-jour": "📦"
}

for msg in consumer:
    topic = msg.topic
    event = msg.value
    date_str = datetime.utcnow().strftime('%Y-%m-%d')
    hdfs_path = f"{HDFS_BASE_PATH}/{topic}/{date_str}.json"
    
    event_json = json.dumps(event, ensure_ascii=False) + "\n"
    
    # Essayer HDFS d'abord, fallback vers local
    hdfs_success = write_to_hdfs(hdfs_path, event_json.encode('utf-8'))
    local_success = write_to_local_backup(topic, event_json)
    
    if hdfs_success or local_success:
        event_count[topic] += 1
        emoji = emoji_map.get(topic, "📨")
        storage = "HDFS" if hdfs_success else "Local"
        print(f"{emoji} [{topic}] Event #{event_count[topic]} → {storage}")
    else:
        print(f"❌ Échec complet pour {topic}")
    
    if sum(event_count.values()) % 10 == 0:
        print(f"\n📊 Total: {sum(event_count.values())} événements")
        for t in TOPICS:
            if event_count[t] > 0:
                print(f"   {t}: {event_count[t]}")
        print()
