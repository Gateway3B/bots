cd C:/Users/g3tech/Server/Bots

docker pull mongo
docker load < bots.tar

docker compose down

docker compose up