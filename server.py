import json
import requests
import threading
import time
from backend import backend_bp
from models import db
from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Developer db setup
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///PROJ.db"
db.init_app(app)

# Schema creation
with app.app_context():
    db.create_all()

# Registering blueprint
app.register_blueprint(backend_bp)

external_servers = {
    "data1": "http://external-server1.com/api/data1",
    "data2": "http://external-server2.com/api/data2",
    "data3": "http://external-server3.com/api/data3",
}

# Function to update the data with 1800 second interval
def fetch_and_update_data(antenna_key, url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        with open(f'./web_server/static/randomdata/{antenna_key}.json', 'w') as f:
            json.dump(data, f)
        print(f"Data {antenna_key} has been updated.")
    except (requests.RequestException, json.JSONDecodeError) as e:
        print(f"An error occured during the update of {antenna_key}: {e}")

def periodic_sync(interval=1800):
    while True:
        print("Starting the update of data...")
        for antenna, url in external_servers.items():
            fetch_and_update_data(antenna, url)
        print("Update finished. Next one in 30 minutes.")
        time.sleep(interval)

# Adding routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data1')
def get_data1():
    return get_local_data('data1')

@app.route('/data2')
def get_data2():
    return get_local_data('data2')

@app.route('/data3')
def get_data3():
    return get_local_data('data3')

def get_local_data(antenna_key):
    try:
        with open(f'./web_server/static/randomdata/{antenna_key}.json', 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON data'}), 500

if __name__ == '__main__':
    # Synchronization in another thread
    sync_thread = threading.Thread(target=periodic_sync, daemon=True)
    sync_thread.start()

    # Turn on server
    app.run(host='0.0.0.0', port=5000)