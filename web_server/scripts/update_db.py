#!../../.venv/bin/python3
import os
from numpy import fromfile, float32
import datetime
import json
import sys

# To import from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.realpath(__file__))))
from server import app, db
from models import Data, Antenna

class DateTimeJSONEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            return super(DateTimeJSONEncoder, self).default(obj)

# Setting raw data path and listing all files
data_path = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
all_fetched_files = os.popen(f'ls {data_path}').read().split("\n")
all_fetched_files.pop()

# Checking for every file if it exists in database
for fetched_file in all_fetched_files:
    # For better readability later on
    file_path = os.path.join(data_path, fetched_file)
    # Separating Anttenna name from date and time
    splitted = fetched_file.split('_')
    name = splitted[0]
    ymd = splitted[1].split('-')
    hms = splitted[2].split(':')

    # Looking for existing data and antenna
    with app.app_context():
        existing_data = Data.query.filter_by(data_id=fetched_file).scalar()
        existing_antenna = Antenna.query.filter_by(antenna_id=name).scalar()

    # If we already have data from this file, so we can move on
    if existing_data is not None:
        continue
        
    date = datetime.datetime(int(ymd[0]), int(ymd[1]), int(ymd[2]),
                             int(hms[0]), int(hms[1]), int(hms[2]))
    
    # Reading file data
    raw_data = fromfile(open(file_path), dtype = float32)

    # Converting array of float32 to list of float
    data = [ float(val) for val in raw_data ]
    
    with app.app_context():
        # If antenna doesn't exist we create one
        if existing_antenna is None:
            existing_antenna = Antenna(antenna_id=name)
            db.session.add(existing_antenna)
            db.session.commit()

        new_data = Data(data_id=fetched_file,
                        data=data,
                        timestamp=date,
                        antenna=existing_antenna)
        db.session.add(new_data)
        db.session.commit()