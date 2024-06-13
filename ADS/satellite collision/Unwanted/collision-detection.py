import pymongo
from sgp4.api import Satrec, jday
from datetime import datetime, timedelta
import numpy as np

# Connect to MongoDB
client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['satellite_db']
collection = db['active_satellites']

# Query all satellites
satellites = list(collection.find().limit(100))

# Function to propagate satellite position
def propagate_satellite(tle1, tle2, time):
    s = Satrec.twoline2rv(tle1, tle2)
    jd, fr = jday(time.year, time.month, time.day, time.hour, time.minute, time.second)
    e, r, v = s.sgp4(jd, fr)
    return r, v  # Returns position and velocity vectors

# Function to calculate distance between two vectors
def distance(vec1, vec2):
    return np.linalg.norm(np.array(vec1) - np.array(vec2))

# Function to check for potential collision
def check_collision(sat1, sat2, threshold=1000):
    for pos1 in sat1['positions']:
        for pos2 in sat2['positions']:
            time1 = datetime.strptime(pos1['EPOCH'], "%Y-%m-%dT%H:%M:%S.%f")
            time2 = datetime.strptime(pos2['EPOCH'], "%Y-%m-%dT%H:%M:%S.%f")
            
            if time1 == time2:
                r1, v1 = propagate_satellite(tle1=sat1['TLE_LINE1'], tle2=sat1['TLE_LINE2'], time=time1)
                r2, v2 = propagate_satellite(tle1=sat2['TLE_LINE1'], tle2=sat2['TLE_LINE2'], time=time2)
                
                if distance(r1, r2) < threshold:
                    return True  # Potential collision
            else:
                print("Time Mismatch")
    return False

# Generate TLEs for demonstration (in real cases, fetch the actual TLEs)
for sat in satellites:
    sat['TLE_LINE1'] = "1 25544U 98067A   20362.54791667  .00002182  00000-0  43203-4 0  9991"
    sat['TLE_LINE2'] = "2 25544  51.6442 163.8661 0002574  89.5312  9.3016 15.48972506232020"

# Check for potential collisions
collision_pairs = []
for i in range(len(satellites)):
    for j in range(i+1, len(satellites)):
        print("Checking Collision between : ", satellites[i]['OBJECT_NAME'], satellites[j]['OBJECT_NAME'])
        if check_collision(satellites[i], satellites[j]):
            collision_pairs.append((satellites[i]['OBJECT_NAME'], satellites[j]['OBJECT_NAME']))

print("Potential Collision Pairs:")
for pair in collision_pairs:
    print(pair)
