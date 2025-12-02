# FROM apache/spark:3.5.0

# USER root

# WORKDIR /app

# RUN apt-get update && \
#     apt-get install -y python3-pip && \
#     rm -rf /var/lib/apt/lists/*

# RUN pip3 install --no-cache-dir pyspark

# RUN mkdir -p /home/spark/.ivy2/cache && \
#     mkdir -p /home/spark/.ivy2/jars && \
#     chown -R spark:spark /home/spark/.ivy2

# COPY spark_streaming_job.py /app/

# USER spark

# CMD ["sh", "-c", "sleep 30 && python3 /app/spark_streaming_job.py"]

FROM apache/spark:3.5.0

USER root

RUN mkdir -p /home/spark/.ivy2/cache && \
    mkdir -p /home/spark/.ivy2/jars && \
    mkdir -p /tmp/checkpoint && \
    chmod -R 777 /home/spark/.ivy2 && \
    chmod -R 777 /tmp/checkpoint

WORKDIR /app
COPY spark_streaming_realtime.py .

USER spark

CMD ["sh", "-c", "sleep 40 && /opt/spark/bin/spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0 --master local[*] /app/spark_streaming_realtime.py"]