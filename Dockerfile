FROM python:3.12-alpine

WORKDIR /app
COPY index.html styles.css app.js server.py ./
RUN mkdir -p /data

ENV PORT=8080
ENV DATA_DIR=/data
EXPOSE 8080

CMD ["python", "server.py"]
