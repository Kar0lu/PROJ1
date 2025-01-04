# from sys import argv
import os, json
from datetime import datetime
import serialize_data


path = os.path.dirname(__file__)

servers = os.popen(f"ls {path}/ssh_certs").read().split("\n")
servers.pop()
print(servers)

file_list = {}
for host in servers:
    # W folderze ssh_certs powinny znajdować się klucze prywatne do komputerów z których pobieramy dane nazwane zgodnie z formatem: "<username>@<hostname>"
    temp = os.popen(f"ssh -i {path}/ssh_certs/{host} {host} ls /root/test_data").read().split("\n") #Sprawdzanie jakie pliki są na serwerze
    temp.pop()
    file_list[host] = temp

with open(os.path.join(path, "..", "web_server", "data", "files_retrieved.json"), "r") as file:
    files_already_retrieved = json.load(file)

for host, files in file_list.items():
    for file in files:
        if file not in files_already_retrieved:
            os.system(f"scp -i {path}/ssh_certs/{host} {host}:/root/test_data/{file} {path}/temp")
            files_already_retrieved.append(file)

with open(os.path.join(path, "..", "web_server", "data", "files_retrieved.json"), "w") as file2:
    json.dump(files_already_retrieved, file2, indent=4)

def process_file(file):
    to_append = serialize_data.serialize_data(os.path.join(path, "temp",file), 5)
    antenna = file.split('_')[0]
    with open(os.path.join(path, "..", "web_server", "data", f"{antenna}.json"), "r") as data_file:
        data = json.load(data_file)
        for a in to_append:
            data.append(a)
    with open(os.path.join(path, "..", "web_server", "data", f"{antenna}.json"), "w") as data_file:
        json.dump(data, data_file, cls = serialize_data.DateTimeJSONEncoder, indent = 4)
    os.remove(f"{path}/temp/{file}")

to_process = os.popen(f"ls {path}/temp").read().split("\n")
to_process.pop()

for processing in to_process:
    process_file(processing)







