set ip=192.168.1.90

docker save bots:latest > ./bots.tar

scp bots.tar matthewweisfeld@%ip%:~/Documents/G3Tech/Server/Bots

scp docker-compose.yml matthewweisfeld@%ip%:~/Documents/G3Tech/Server/Bots
scp deploy/remoteDeploy.sh matthewweisfeld@%ip%:~/Documents/G3Tech/Server/Bots

ssh matthewweisfeld@%ip% chmod +x /home/matthewweisfeld/Documents/G3Tech/Server/Bots/remoteDeploy.sh
ssh matthewweisfeld@%ip% /home/matthewweisfeld/Documents/G3Tech/Server/Bots/remoteDeploy.sh
