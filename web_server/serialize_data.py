from numpy import fromfile, float32
from datetime import datetime, timedelta
import json

def serialize_data(path, sample_period):
    antenna = path.split('/')[-1].split('_')[0]
    date = path.split('/')[-1].split('_')[1]
    raw_data = fromfile(open(path), dtype = float32)
    time = datetime.strptime(path.split('/')[-1].split('_')[2], '%H:%M:%S') - datetime(1900,1,1) - timedelta(seconds=sample_period*(len(raw_data)-1)) + datetime(int(date.split('-')[0]), int(date.split('-')[1]), int(date.split('-')[2]))

    to_json = []
    for key in range(0, len(raw_data)):
        if key == 0:
            to_json.append({"date": time, "close": str(raw_data[key])})
        else:
            to_json.append({"date": to_json[key-1]["date"] + timedelta(seconds=sample_period), "close": str(raw_data[key])})

    class DateTimeJSONEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            return super(DateTimeJSONEncoder, self).default(obj)

    return json.dumps(to_json, cls=DateTimeJSONEncoder, indent=4)