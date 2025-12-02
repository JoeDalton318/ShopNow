from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, sum as spark_sum, desc, from_json, window, to_timestamp
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType
import time

print("🚀 Démarrage Spark Streaming - ShopNow+")

spark = SparkSession.builder \
    .appName("ShopNowStreaming") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
    .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoint") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

KAFKA_BROKER = "kafka:9092"

schemas = {
    "produit-consulte": StructType([
        StructField("id_produit", IntegerType()),
        StructField("nom_produit", StringType()),
        StructField("prix", DoubleType()),
        StructField("timestamp", StringType()),
        StructField("user_id", IntegerType())
    ]),
    "article-ajoute": StructType([
        StructField("client_id", IntegerType()),
        StructField("variante_id", IntegerType()),
        StructField("produit_id", IntegerType()),
        StructField("nom_produit", StringType()),
        StructField("quantite", IntegerType()),
        StructField("prix_unitaire", DoubleType()),
        StructField("timestamp", StringType())
    ]),
    "commande-validee": StructType([
        StructField("id_commande", IntegerType()),
        StructField("client_id", IntegerType()),
        StructField("total", DoubleType()),
        StructField("timestamp", StringType())
    ]),
    "stock-mis-a-jour": StructType([
        StructField("produit_id", IntegerType()),
        StructField("ancien_stock", IntegerType()),
        StructField("nouveau_stock", IntegerType()),
        StructField("variation", IntegerType()),
        StructField("raison", StringType()),
        StructField("timestamp", StringType())
    ])
}

def create_kafka_stream(topic, schema):
    """Créer un stream Kafka pour un topic donné"""
    df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", KAFKA_BROKER) \
        .option("subscribe", topic) \
        .option("startingOffsets", "latest") \
        .option("failOnDataLoss", "false") \
        .load()
    
    parsed_df = df.select(
        from_json(col("value").cast("string"), schema).alias("data")
    ).select("data.*")
    
    return parsed_df

print("\n📡 Connexion aux topics Kafka...")

df_consultes = create_kafka_stream("produit-consulte", schemas["produit-consulte"])
df_panier = create_kafka_stream("article-ajoute", schemas["article-ajoute"])
df_commandes = create_kafka_stream("commande-validee", schemas["commande-validee"])
df_stock = create_kafka_stream("stock-mis-a-jour", schemas["stock-mis-a-jour"])

print("\n📊 STREAMING 1: TOP 10 Produits consultés (fenêtre 10 min)")
df_consultes_parsed = df_consultes.withColumn(
    "timestamp_parsed", 
    to_timestamp(col("timestamp"))
)

top_produits_stream = df_consultes_parsed \
    .withWatermark("timestamp_parsed", "15 minutes") \
    .groupBy(
        window(col("timestamp_parsed"), "10 minutes", "2 minutes"),
        col("id_produit"),
        col("nom_produit")
    ) \
    .agg(count("*").alias("nb_consultations")) \
    .orderBy(desc("nb_consultations"))

query1 = top_produits_stream.writeStream \
    .outputMode("complete") \
    .format("console") \
    .option("truncate", False) \
    .option("numRows", 10) \
    .trigger(processingTime="30 seconds") \
    .queryName("top_produits") \
    .start()

print("\n💰 STREAMING 2: Chiffre d'affaires en temps réel (fenêtre 5 min)")
df_commandes_parsed = df_commandes.withColumn(
    "timestamp_parsed", 
    to_timestamp(col("timestamp"))
)

ca_stream = df_commandes_parsed \
    .withWatermark("timestamp_parsed", "10 minutes") \
    .groupBy(window(col("timestamp_parsed"), "5 minutes", "1 minute")) \
    .agg(
        spark_sum("total").alias("CA_Total"),
        count("*").alias("nb_commandes")
    )

query2 = ca_stream.writeStream \
    .outputMode("complete") \
    .format("console") \
    .option("truncate", False) \
    .trigger(processingTime="30 seconds") \
    .queryName("chiffre_affaires") \
    .start()

print("\n🛍️ STREAMING 3: Produits ajoutés au panier (fenêtre 10 min)")
df_panier_parsed = df_panier.withColumn(
    "timestamp_parsed", 
    to_timestamp(col("timestamp"))
)

panier_stream = df_panier_parsed \
    .withWatermark("timestamp_parsed", "15 minutes") \
    .groupBy(
        window(col("timestamp_parsed"), "10 minutes", "2 minutes"),
        col("produit_id"),
        col("nom_produit")
    ) \
    .agg(
        count("*").alias("nb_ajouts"),
        spark_sum("quantite").alias("quantite_totale")
    ) \
    .orderBy(desc("nb_ajouts"))

query3 = panier_stream.writeStream \
    .outputMode("complete") \
    .format("console") \
    .option("truncate", False) \
    .option("numRows", 10) \
    .trigger(processingTime="30 seconds") \
    .queryName("produits_panier") \
    .start()

print("\n📦 STREAMING 4: Alertes rupture de stock (temps réel)")
df_stock_parsed = df_stock.withColumn(
    "timestamp_parsed", 
    to_timestamp(col("timestamp"))
)

alertes_stock = df_stock_parsed \
    .withWatermark("timestamp_parsed", "10 minutes") \
    .filter(col("nouveau_stock") < 10) \
    .select(
        col("produit_id"),
        col("nouveau_stock"),
        col("raison"),
        col("timestamp_parsed")
    )

query4 = alertes_stock.writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .trigger(processingTime="10 seconds") \
    .queryName("alertes_stock") \
    .start()

print("\n✅ Tous les streams démarrés !")
print("=" * 60)
print("Les analyses s'affichent toutes les 30 secondes")
print("Les alertes stock s'affichent toutes les 10 secondes")
print("Appuyez sur Ctrl+C pour arrêter")
print("=" * 60)

spark.streams.awaitAnyTermination()
