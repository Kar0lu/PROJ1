#!/bin/bash

for key in `ls $1`; do # Pierwszy argument to ścieżka do folderu zawierającego klucze SSH w formacie <username@<hostname>
    IFS='@' read -ra split_key <<< "$key"
    mkdir -p $3/${split_key[1]}; # Trzeci argument to docelowe miejsce na pobierane dane
    rsync -r -e "ssh -i $1/$key" $key:$2 $3/${split_key[1]}; # Drugi argument to lokalizacja, pod którą znajdują się pliki na serwerze
done
