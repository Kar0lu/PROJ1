#!/bin/sh
cd $( dirname -- "$( readlink -f -- "$0" )")  # Zmiana katalogu na katalog w którym znajduje się skrypt

for key in `ls ./ssh_keys`; do
    mkdir -p ../data/raw;
    rsync -r -e "ssh -i ./ssh_keys/$key" $key:$1 ../data/raw; # Pierwszy argument to lokalizacja, pod którą znajdują się pliki na serwerze
done
./update_db.py