from datetime import datetime
from flask import ( Blueprint,
                    request,
                    jsonify )
from models import Data, Antenna

backend_bp = Blueprint('backend', __name__)

    
@backend_bp.route('/get_real_data', methods = ['GET'])
def get_retrived_data_in_json_format():
    try:
        antenna_name = request.args.get('antenna').upper()
        if len(antenna_name) != 3: raise Exception()     # Some generic exception so as to return 400
        start_time = datetime.fromisoformat(request.args.get('start_time'))
        stop_time = datetime.fromisoformat(request.args.get('stop_time'))
    except:
        res = jsonify({ "error": "Expected arguments: antenna (3 letter antenna location shortcut), start_time (datetime in ISO format), stop_time (datetime in ISO format)" })
        res.status_code = 400
        return res
    
    # Checking if antenna exists
    antenna = Antenna.query.get(antenna_name)
    if antenna is None:
        res = jsonify({ "error": f"No antenna {antenna_name}" })
        res.status_code = 400
        return res

    # Filtering data and sorting it ascending
    filtered_data = antenna.data.filter( Data.timestamp >= start_time,
                                         Data.timestamp <= stop_time ).order_by(Data.timestamp.asc()).all()
    
    one_before = antenna.data.filter( Data.timestamp < start_time ).order_by( Data.timestamp.desc() ).first()
    one_after = antenna.data.filter( Data.timestamp > stop_time ).order_by( Data.timestamp.asc() ).first()
    
    filtered_data = { d.timestamp.isoformat(): d.data for d in filtered_data }
    filtered_data[one_before.timestamp.isoformat()] = one_before.data
    filtered_data[one_after.timestamp.isoformat()] = one_after.data
    
    return jsonify(filtered_data)

@backend_bp.route('/get_antennas', methods = ['GET'])
def get_antennas():
    antennas = Antenna.query.all()
    antennas = { "content": [ a.antenna_id for a in antennas ] }
    return jsonify(antennas)
