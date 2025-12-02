# Backend Dockerfile for Flask + Kafka wait
FROM python:3.10-slim

WORKDIR /app

COPY . /app/

RUN pip install --no-cache-dir flask kafka-python flask-cors kagglehub pandas

# Ajoute une attente avant de démarrer Flask pour laisser Kafka démarrer
CMD ["sh", "-c", "sleep 10 && python app.py"]

EXPOSE 5000
