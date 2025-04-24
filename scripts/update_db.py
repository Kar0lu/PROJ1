#!../.venv/bin/python3
import os
import numpy as np
import datetime
import sys
from tqdm import tqdm

# To import from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
from server import app, db
from models import Data, Antenna

# Setting raw data path and listing all files
data_path = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
all_fetched_files = [
    f for f in os.listdir(data_path)
    if f and not f.startswith('.')  # pomijamy puste i ukryte pliki
]
all_fetched_files.pop()

with app.app_context():
    existing_antennas = {a.antenna_id for a in Antenna.query.all()}
    existing_data_keys = {
        (d.antenna_id, d.timestamp) for d in Data.query.with_entities(Data.antenna_id, Data.timestamp)
    }

    buffer = []
    batch_size = 1000

    for fetched_file in tqdm(all_fetched_files):
        # For better readability later on
        file_path = os.path.join(data_path, fetched_file)
        # Separating Anttenna name from date and time
        splitted = fetched_file.split('_')

        if len(splitted) < 3:
            print(f"Ommiting bad filename: {fetched_file}")
            continue
        name = splitted[0]

        try:
            ymd = splitted[1].split('-')
            hms = splitted[2].split(':')
            date = datetime.datetime(int(ymd[0]), int(ymd[1]), int(ymd[2]),
                                    int(hms[0]), int(hms[1]), int(hms[2]))
        except (IndexError, ValueError) as e:
            print(f"Date parsing error in file {fetched_file}: {e}")
            continue

        # Looking for existing data
        if (name, date) in existing_data_keys:
            continue
            
        # Reading file data if file is not corrupt
        if os.path.getsize(file_path) != 768: continue
        raw_data = np.fromfile(open(file_path), dtype = np.float32)

        mean = float(np.nanmean(raw_data))
        max = float(np.nanmax(raw_data))
        min = float(np.nanmin(raw_data))

        # Converting array of float32 to list of float
        data = [ float(val) for val in raw_data ]
        

        # If antenna doesn't exist we create one
        if name not in existing_antennas:
            db.session.add(Antenna(antenna_id=name))
            existing_antennas.add(name)

        # Add data to buffer
        buffer.append(Data( data=data,
                            timestamp=date,
                            antenna_id=name,
                            mean_value = mean,
                            max_value=max,
                            min_value=min ))

        # Commit in batches
        if len(buffer) >= batch_size:
            db.session.add_all(buffer)
            db.session.commit()
            buffer = []

    # If something left in buffer commit it
    if buffer:
        db.session.add_all(buffer)
        db.session.commit()