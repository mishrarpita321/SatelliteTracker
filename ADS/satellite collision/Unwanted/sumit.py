import requests
from pymongo import MongoClient

def fetch_tle_data(url):
    response = requests.get(url)
    tle_data = response.text.splitlines()
    satellites = []
    
    for i in range(0, len(tle_data), 3):
        satellite = {
            "name": tle_data[i].strip(),
            "line1": tle_data[i + 1].strip(),
            "line2": tle_data[i + 2].strip()
        }
        satellites.append(satellite)
    
    return satellites

def store_in_mongodb(satellites):
    client = MongoClient('mongodb://localhost:27017/')
    db = client['satellite_db']
    collection = db['satellite_tle']
    collection.insert_many(satellites)

    for satellite in collection.find():
        print(satellite)

tle_url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json'
satellites = fetch_tle_data(tle_url)
store_in_mongodb(satellites)
