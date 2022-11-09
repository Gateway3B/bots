set ip=192.168.87.244

@REM docker save bots:latest > ./bots.tar

@REM scp bots.tar g3tech@%ip%:\Users\g3tech\Server\Bots

scp docker-compose.yml g3tech@%ip%:\Users\g3tech\Server\Bots
scp deploy/remoteDeploy.bat g3tech@%ip%:\Users\g3tech\Server\Bots

ssh g3tech@%ip% \Users\g3tech\Server\Bots\remoteDeploy.bat