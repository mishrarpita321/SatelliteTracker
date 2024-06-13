import streamlit as st
import requests
from pymongo import MongoClient
from datetime import datetime
import time
from neo4j import GraphDatabase
import plotly.graph_objects as go
import pytz
from datetime import timedelta
from sgp4.api import Satrec, jday


def main():
    st.set_page_config(layout="wide")  
    st.title("Satellite Collision Detection & Orbit Mapping")
    caption = None 

    client = MongoClient('mongodb://localhost:27017/')
    mongo_db = client.celestrak
    collection = mongo_db.activeSats
    satellite_list = collection.find({}, {'name': 1, '_id': 0})
    satellite_names = [sat['name'] for sat in satellite_list]   

    neo4j_uri = "bolt://localhost:7687"
    neo4j_driver = GraphDatabase.driver(neo4j_uri, auth=("sumit", "abcd12345"))

    with st.sidebar:
        satellite1_name = st.selectbox('Select Satellite 1', (satellite_names))
        satellite2_name = st.selectbox('Select Satellite 2', (satellite_names[1:]))
        duration_hours = 24
        time_step = 5

        gc = st.button("Calculate Closest Approach")

    #(Fetch TLE data and timestamps from MongoDB)
    line1_satellite1, line2_satellite1, timestamp_satellite1 = fetch_satellite_data(satellite1_name, collection)
    line1_satellite2, line2_satellite2, timestamp_satellite2 = fetch_satellite_data(satellite2_name, collection)

    
    positions_satellite1 = calculate_orbital_path(line1_satellite1, line2_satellite1, time_step, duration_hours)
    positions_satellite2 = calculate_orbital_path(line1_satellite2, line2_satellite2, time_step, duration_hours)

    print(f'{satellite1_name} : Line 1 ({line1_satellite1}), Line 2 ({line2_satellite1}), timestamp ({timestamp_satellite1})')
    print(f'{satellite1_name} Positions : {positions_satellite1}')

    print(f'{satellite2_name} : Line 1 ({line1_satellite2}), Line 2 ({line2_satellite2}), timestamp ({timestamp_satellite2})')
    print(f'{satellite2_name} Positions : {positions_satellite2}')

    col1, col2 = st.columns([2,1], gap="large")

    with st.spinner('Plotting orbital paths, please wait...'):
        fig = createPlot(satellite1_name, positions_satellite1, satellite2_name, positions_satellite2)

    with col1:        
        if positions_satellite1 is not None and positions_satellite2 is not None:
            st.subheader('Orbital Paths of Satellites')
            st.plotly_chart(fig)

    with col2:                 
        if gc:            
            st.subheader("Closest Approach Calculation:")
            with st.spinner('Calculating orbital paths, please wait...'):
                with neo4j_driver.session() as session:
                    session.execute_write(create_nodes_in_neo4j, satellite1_name, positions_satellite1)
                    session.execute_write(create_nodes_in_neo4j, satellite2_name, positions_satellite2)

                    # Find nodes of closest approach between the two satellites
                    closest_approach = session.execute_read(find_closest_approach, satellite1_name, satellite2_name)
                    p1 = closest_approach["p1"]
                    p2 = closest_approach["p2"]
                    dist = closest_approach["dist"]
                    print("Nodes of closest approach:")
                    print(f'{satellite1_name} and {satellite2_name} are at a distance of {closest_approach["dist"]} km on {datetime.fromtimestamp(p1["timestamp"])}')
                    print("Position 1:", p1["x"], p1["y"], p1["z"], p1["timestamp"])
                    print("Position 2:", p2["x"], p2["y"], p2["z"], p2["timestamp"])

            if p1 is not None and  p2 is not None and  closest_approach is not None:                
                st.write("Nodes of closest approach:")
                st.write(f'{satellite1_name} and {satellite2_name} are at a distance of {closest_approach["dist"]} km on {datetime.fromtimestamp(p1["timestamp"])}')
                st.write("Position 1:", p1["x"], p1["y"], p1["z"], p1["timestamp"])
                st.write("Position 2:", p2["x"], p2["y"], p2["z"], p2["timestamp"])


def fetch_satellite_data(name, collection):
    result = collection.find_one({"name": name})
    return result["line1"], result["line2"], result["timestamp"]

def calculate_orbital_path(line1, line2, time_step_minutes=5, duration_hours=24):
    satellite = Satrec.twoline2rv(line1, line2)
    start_time = datetime.utcnow()
    time_step = timedelta(minutes=time_step_minutes)
    duration = timedelta(hours=duration_hours)
    positions = []
    current_time = start_time
    while current_time < start_time + duration:
        jd, fr = jday(current_time.year, current_time.month, current_time.day,
                      current_time.hour, current_time.minute, current_time.second + current_time.microsecond / 1e6)
        e, r, v = satellite.sgp4(jd, fr)
        timestamp_seconds = int(current_time.timestamp())  # Convert to Unix timestamp in seconds
        positions.append({"x": r[0], "y": r[1], "z": r[2], "timestamp": timestamp_seconds})
        current_time += time_step
    return positions

#(create nodes in Neo4j for the orbital path of a satellite)
def create_nodes_in_neo4j(tx, satellite_name, positions):
    for i, pos in enumerate(positions):
        query = (
            "MERGE (p:Position {x: $x, y: $y, z: $z, timestamp: $timestamp}) "
            "WITH p "
            "MATCH (s:SAT {name: $satellite_name}) "
            "CREATE (s)-[:HAS_POSITION]->(p)"
        )
        tx.run(query, x=pos["x"], y=pos["y"], z=pos["z"], timestamp=pos["timestamp"], satellite_name=satellite_name)
        
def find_closest_approach(tx, satellite1, satellite2):
    query = (
        "MATCH (s1:SAT {name: $satellite1})-[:HAS_POSITION]->(p1:Position), "
        "(s2:SAT {name: $satellite2})-[:HAS_POSITION]->(p2:Position) "
        "WHERE p1.timestamp = p2.timestamp "  
        "WITH p1, p2, point.distance(point({x: p1.x, y: p1.y, z: p1.z}), point({x: p2.x, y: p2.y, z: p2.z})) AS dist "
        "ORDER BY dist ASC "
        "LIMIT 1 "
        "RETURN p1, p2, dist"
    )
    result = tx.run(query, satellite1=satellite1, satellite2=satellite2)
    return result.single()

def format_timestamp_to_cet(timestamp):
    dt_utc = datetime.utcfromtimestamp(timestamp)
    dt_utc = pytz.utc.localize(dt_utc)
    dt_cet = dt_utc.astimezone(pytz.timezone('CET'))
    return dt_cet.strftime('%Y-%m-%d %H:%M:%S')

def createPlot(satellite1_name, positions_satellite1, satellite2_name, positions_satellite2):
    
    #(Extract coordinates and timestamps)
    x1 = [pos['x'] for pos in positions_satellite1]
    y1 = [pos['y'] for pos in positions_satellite1]
    z1 = [pos['z'] for pos in positions_satellite1]
    timestamps1 = [format_timestamp_to_cet(pos['timestamp']) for pos in positions_satellite1]

    
    x2 = [pos['x'] for pos in positions_satellite2]
    y2 = [pos['y'] for pos in positions_satellite2]
    z2 = [pos['z'] for pos in positions_satellite2]
    timestamps2 = [format_timestamp_to_cet(pos['timestamp']) for pos in positions_satellite2]

    
    fig = go.Figure()

    #(trace for Satellite positions)
    fig.add_trace(go.Scatter3d(
        x=x1,
        y=y1,
        z=z1,
        mode='markers+lines',
        marker=dict(
            size=4,
            color='blue',
        ),
        line=dict(
            color='blue',
            width=2
        ),
        name=satellite1_name,
        text=timestamps1
    ))

    
    fig.add_trace(go.Scatter3d(
        x=x2,
        y=y2,
        z=z2,
        mode='markers+lines',
        marker=dict(
            size=4,
            color='red',
        ),
        line=dict(
            color='red',
            width=2
        ),
        name=satellite2_name,
        text=timestamps2
    ))

    
    fig.update_layout(
        title=f'Orbital Paths of {satellite1_name} and {satellite2_name}',
        scene=dict(
            xaxis_title='X (km)',
            yaxis_title='Y (km)',
            zaxis_title='Z (km)'
        ),
        margin=dict(l=0, r=0, b=0, t=40)
    )

    
    return fig

if __name__ == "__main__":
    main()
