FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspaces
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

EXPOSE 8001
ENV PYTHONPATH="/app"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]