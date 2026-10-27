FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY scheduler.py .
COPY controller.py .

ENV PYTHONUNBUFFERED=1

CMD ["python", "controller.py"]