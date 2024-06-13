import requests
from pymongo import MongoClient, UpdateOne
from datetime import datetime
import time

# URL to fetch satellite data
url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json'

# Fetch data from URL
response = requests.get(url)
satellite_data = response.json()

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['satellite_db']
collection = db['active_satellites']

# Prepare the data for MongoDB
bulk_operations = []

x = 0 

for sat in satellite_data:
    epoch = sat['EPOCH']
    
    position = {
        "EPOCH": epoch,
        "MEAN_MOTION": sat['MEAN_MOTION'],
        "ECCENTRICITY": sat['ECCENTRICITY'],
        "INCLINATION": sat['INCLINATION'],
        "RA_OF_ASC_NODE": sat['RA_OF_ASC_NODE'],
        "ARG_OF_PERICENTER": sat['ARG_OF_PERICENTER'],
        "MEAN_ANOMALY": sat['MEAN_ANOMALY'],
        "EPHEMERIS_TYPE": sat['EPHEMERIS_TYPE'],
        "CLASSIFICATION_TYPE": sat['CLASSIFICATION_TYPE'],
        "NORAD_CAT_ID": sat['NORAD_CAT_ID'],
        "ELEMENT_SET_NO": sat['ELEMENT_SET_NO'],
        "REV_AT_EPOCH": sat['REV_AT_EPOCH'],
        "BSTAR": sat['BSTAR'],
        "MEAN_MOTION_DOT": sat['MEAN_MOTION_DOT'],
        "MEAN_MOTION_DDOT": sat['MEAN_MOTION_DDOT'],
        "timestamp": int(time.time())  # Add the current timestamp
    }
    query = {
        "OBJECT_ID": sat['OBJECT_ID'],
        "positions": {"$not": {"$elemMatch": {"EPOCH": epoch}}}
    }
    existing_doc = collection.find_one(query)

    # Add to bulk operations only if a matching document is found
    if existing_doc:
        print("Inserting new position")
        update = {
            "$set": {"OBJECT_NAME": sat['OBJECT_NAME'], "OBJECT_ID": sat['OBJECT_ID']},
            "$push": {"positions": position}
        }
        bulk_operations.append(UpdateOne(query, update, upsert=True))
    x+=1
    print(x)

print(bulk_operations)
# Execute the bulk write operation
if bulk_operations:
    print("Reaching HEre")
    result = collection.bulk_write(bulk_operations)
    print(result)
    print(f"Matched: {result.matched_count}, Modified: {result.modified_count}, Upserted: {result.upserted_count}")
else:
    print("No data to update")

print("Data inserted/updated successfully")
