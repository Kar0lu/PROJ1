from sys import argv
from numpy import fromfile, float32, nditer
from datetime import datetime, timedelta
import json

okres_probkowania = int(argv[2])
antenna = argv[1].split('/')[-1].split('_')[0]
date = argv[1].split('/')[-1].split('_')[1]
raw_data = fromfile(open(argv[1]), dtype = float32)
time = datetime.strptime(argv[1].split('/')[-1].split('_')[2], '%H:%M:%S') - datetime(1900,1,1) - timedelta(seconds=okres_probkowania*(len(raw_data)-1)) + datetime(int(date.split('-')[0]), int(date.split('-')[1]), int(date.split('-')[2]))

indexes = [ i for i in range(0, len(raw_data)) ]
to_json = [{"date": time, "close": str(raw_data[0])}]
for key, sample in nditer([indexes, raw_data]):
    if key == 0:
        continue
    to_json.append({"date": to_json[key-1]["date"] + timedelta(seconds=5), "close": str(sample)})

class DateTimeJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(DateTimeJSONEncoder, self).default(obj)

ready = json.dumps(to_json, cls=DateTimeJSONEncoder, indent=4)
print(ready)








