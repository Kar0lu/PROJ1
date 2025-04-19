#!/bin/sh

for key in `ls $1`; do # Pierwszy argument to ścieżka do folderu zawierającego klucze SSH w formacie <username@<hostname>
    mkdir -p $3; # Trzeci argument to docelowe miejsce na pobierane dane
    rsync -r -e "ssh -i $1/$key" $key:$2 $3; # Drugi argument to lokalizacja, pod którą znajdują się pliki na serwerze
done
./update_db.py