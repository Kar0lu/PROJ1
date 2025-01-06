from datetime import datetime
import scripts.jsonize
import os, scripts.serialize_data

def start_date(date_list, target_date):
    earlier_dates = [date for date in date_list if date < target_date]

    if earlier_dates:
        return max(earlier_dates).isoformat()
    else:
        return None


def end_date(date_list, target_date):
    later_dates = [date for date in date_list if date > target_date]
    
    if later_dates:
        return min(later_dates).isoformat()
    else:
        return None
    
def get_our_datetime_format_from_isoformat(iso):
    return iso.replace("T", "_")
    
def get_json(antenna, start, stop):
    path = os.path.dirname(__file__)
    all_fetched_files = os.popen(f'ls {os.path.join(path, "..", "data", "raw", antenna)}').read().split("\n")
    all_fetched_files.pop()
    all_dates_list = []
    for file in all_fetched_files:
        split_file = file.split("_")
        date = split_file[1] + "T" + split_file[2]
        all_dates_list.append(datetime.fromisoformat(date))
    start_filename = antenna + "_" + get_our_datetime_format_from_isoformat(start_date(all_dates_list, datetime.fromisoformat(start)))
    end_filename = antenna + "_" + get_our_datetime_format_from_isoformat(end_date(all_dates_list, datetime.fromisoformat(stop)))
    files_to_process = all_fetched_files[all_fetched_files.index(start_filename) : all_fetched_files.index(end_filename) + 1]
    full_process_list = []
    for file_to_process in files_to_process:
        full_process_list.append(os.path.join(path, "..", "data", "raw", antenna, file_to_process))
    # Pamiętać o ustawieniu prawidłowego okresu próbkowania
    return scripts.serialize_data.serialize_data(full_process_list, 5)
