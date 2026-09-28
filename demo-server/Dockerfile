# ThreatX Python Simulated Target Server Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY demo-server/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY demo-server/ ./

EXPOSE 5001

CMD ["python", "demo_server.py"]
