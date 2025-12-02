FROM python:3.10-slim

WORKDIR /app

COPY consumer_multi_topics.py /app/

RUN pip install --no-cache-dir kafka-python requests

CMD ["sh", "-c", "sleep 15 && python consumer_multi_topics.py"]
