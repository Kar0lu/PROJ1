import json
import requests
import threading
import time
from scripts.jsonize import get_json
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

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

@app.route('/get_real_data', methods = ['GET'])
def get_retrived_data_in_json_format():
    req = request.get_json()[0]
    return get_json(req['antenna'], req['start'], req['stop'])

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