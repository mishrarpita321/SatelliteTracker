import requests
from pymongo import MongoClient, UpdateOne

# URL to fetch satellite data
url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json'

# Fetch data from URL
response = requests.get(url)
satellite_data = response.json()

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['satellite_db']
collection = db['satellites']

# Prepare the data for MongoDB
bulk_operations = []

for sat in satellite_data:
    position = {
        "EPOCH": sat['EPOCH'],
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
        "MEAN_MOTION_DDOT": sat['MEAN_MOTION_DDOT']
    }
    
    query = {"OBJECT_ID": sat['OBJECT_ID']}
    update = {
        "$set": {"OBJECT_NAME": sat['OBJECT_NAME'], "OBJECT_ID": sat['OBJECT_ID']},
        "$push": {"positions": position}
    }
    bulk_operations.append(UpdateOne(query, update, upsert=True))

# Execute the bulk write operation
if bulk_operations:
    result = collection.bulk_write(bulk_operations)
    print(f"Matched: {result.matched_count}, Modified: {result.modified_count}, Upserted: {result.upserted_count}")
else:
    print("No data to update")

print("Data inserted/updated successfully")
