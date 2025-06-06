# PROJ1
## Authors
- Jakub Szalacha
- Kacper Capiga
- Karol Godlewski
- Karol Pacwa

## Project Objective
Web application visualizing the state of UHF wave propagation.

## Required software
- Docker: https://www.docker.com/

## Starting application
- From root project directory (containing file `compose.yml`) invoke following: `docker compose up`.

### Configuring crontab job to fetch data from remote server
- Before building docker image paste private key for data server to directory `app/scripts/ssh_keys`,
- Rename key to to follow pattern `<username>@<server_IP>`,
- Change container name in file `app/scripts/cron.txt` to reflect one created by compose (usually: `<name of directory compose was run from>-app`),
- Add `app/scripts/cron.txt` to crontab (eg. `crontab app/scripts/cron.txt`).