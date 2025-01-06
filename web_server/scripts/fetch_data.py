# from sys import argv
import os


path = os.path.dirname(__file__)

# Ładowanie hostów do synchronizacji
hosts = os.popen(f'ls {os.path.join(path, "ssh_certs")}').read().split("\n")
hosts.pop()



for host in hosts:
    # Jeżeli jeszcze nie istnieje, to tworzy folder na surowe pliki z serwera
    raw_data_directory = os.path.join(path, "..", "data", "raw", host.split("@")[1])
    os.makedirs(raw_data_directory, exist_ok=True)

    # W folderze ssh_certs powinny znajdować się klucze prywatne do komputerów z których pobieramy dane nazwane zgodnie z formatem: "<username>@<hostname>"
    os.system(f'rsync -r -e "ssh -i {os.path.join(path, "ssh_certs", host)}" {host}:/root/test_data/ {os.path.join(path, "..", "data", "raw", host.split("@")[1])}')
