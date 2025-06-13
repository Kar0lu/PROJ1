#!/bin/sh
cd $( dirname -- "$( readlink -f -- "$0" )")  # Zmiana katalogu na katalog w którym znajduje się skrypt

for key in `ls ./ssh_keys`; do
    mkdir -p ../data/raw;
    rsync --exclude-from=/app/scripts/exclude.txt -r -e "ssh -o StrictHostKeychecking=no -i ./ssh_keys/$key" $key:$1 ../data/raw; # Pierwszy argument to lokalizacja, pod którą znajdują się pliki na serwerze
done
python3 ./update_db.py