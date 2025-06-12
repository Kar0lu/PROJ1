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
- Edit `flask.env` file to set up database connection,
- Paste private key for data server to directory `scripts/ssh_keys`,
- Invoke: `source flask.env && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt` to create python virtual environment and install project's dependencies inside,
- Invoke: `./init_db.py && gunicorn server:app --worker-class gevent --workers 1 --worker-connections 100 --bind 0.0.0.0:8080 --timeout 60` to start application on port 8080,
- Modify file `scripts/cron.txt` too reflect absolute paths to files: `flask.env` and `scripts/fetch_data.sh`,
- Add file `cron.txt` to your crontab or execute command manually.
