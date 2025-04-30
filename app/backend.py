from datetime import datetime
from flask import ( Blueprint,
                    request,
                    jsonify )
from models import Data, Antenna
from sqlalchemy.orm import ( load_only,
                             raiseload )

backend_bp = Blueprint('backend', __name__)

def get_detailed_data(antenna, start_time, stop_time):
    # Filtering data and sorting it ascending
    filtered_data = antenna.data.filter( Data.timestamp >= start_time,
                                         Data.timestamp <= stop_time ).order_by(Data.timestamp.asc()).all()
    
    one_before = antenna.data.filter( Data.timestamp < start_time ).order_by( Data.timestamp.desc() ).first()
    one_after = antenna.data.filter( Data.timestamp > stop_time ).order_by( Data.timestamp.asc() ).first()

    if one_before is not None:
        filtered_data.append(one_before)
    if one_after is not None:
        filtered_data.append(one_after)
    
    filtered_data = { d.timestamp.isoformat(): { "value": d.data, "max": d.max_value, "min": d.min_value, "avg": d.mean_value} for d in filtered_data }
    
    
    return jsonify(filtered_data)

def get_normal_data(antenna, start_time, stop_time):
    load_options = [ load_only(Data.timestamp, Data.mean_value, Data.max_value, Data.min_value),
                     raiseload("*") ]
    # Filtering data and sorting it ascending
    filtered_data = (
    antenna.data
    .options(*load_options)
    .filter(Data.timestamp >= start_time, Data.timestamp <= stop_time)
    .order_by(Data.timestamp.asc())
    .all()
    )

    one_before = (
        antenna.data
        .options(*load_options)
        .filter(Data.timestamp < start_time)
        .order_by(Data.timestamp.desc())
        .first()
    )

    one_after = (
        antenna.data
        .options(*load_options)
        .filter(Data.timestamp > stop_time)
        .order_by(Data.timestamp.asc())
        .first()
    )

    if one_before is not None:
        filtered_data.append(one_before)
    if one_after is not None:
        filtered_data.append(one_after)
    
    filtered_data = { d.timestamp.isoformat(): { "avg": d.mean_value, "max": d.max_value, "min": d.min_value } for d in filtered_data }

    
    return jsonify(filtered_data)

    
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
    
    # Check if request is for detailed or normal data
    try:
        detailed = bool(request.args.get('detailed'))
    except:
        detailed = False
    
    # Checking if antenna exists
    antenna = Antenna.query.get(antenna_name)
    if antenna is None:
        res = jsonify({ "error": f"No antenna {antenna_name}" })
        res.status_code = 400
        return res

    if detailed:
        return get_detailed_data(antenna, start_time, stop_time)
    else:
        return get_normal_data(antenna, start_time, stop_time)

@backend_bp.route('/get_antennas', methods = ['GET'])
def get_antennas():
    antennas = Antenna.query.all()
    antennas = { "content": [ a.antenna_id for a in antennas ] }
    return jsonify(antennas)


@backend_bp.route('/health', methods=["GET"])
def health():
    return "OK", 200
