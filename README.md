# Space Object Tracker and Visualizer

This project is a full-stack application designed to track, visualize, and analyze the orbital data of various space objects, including satellites and asteroids. It provides a 3D and 2D interactive interface to explore the movement and position of these objects in real-time.

## Features

*   **Satellite Tracking:**
    *   Real-time visualization of satellite positions using 3D graphics (Cesium, Three.js) and maps (Leaflet).
    *   Calculating and visualizing satellite positions using SGP4 algorithm.
    *   Fetching satellite orbital data (TLE) for active satellites from Celestrak and storing it in MongoDB.
    *   Real-time satellite position updates through WebSockets.
    *   Implementing drift detection logic and using Neo4j to manage and find historical data.
    *   Filtering Satellite by group name for easier viewing.
*   **Asteroid Tracking:**
    *   Real-time visualization of asteroid positions using 3D graphics (Three.js).
    *   Fetching asteroid data and orbital elements.
    *   Calculating asteroid orbits and positions in real-time.
    *   Displaying asteroid visibility by country on maps.
*   **Satellite Collision Detection:**
    *   Find the closest approach between two satellites.
*   **Astronaut Tracking:**
   *   Tracking the satellites near the astronauts.
*   **Image Overlay:**
    *   Overlaying satellite images with weather data and cloud masks using Sentinel Hub and OpenWeatherMap APIs.
    *   Storing extracted feature data.
*   **Real-time Updates:**
    *   Utilizing WebSockets for real-time position updates and notifications.
*   **User Interface:**
    *   Interactive user interface built with React, providing an intuitive experience.
*   **Basic User Management**:
    *   User authentication via JWT

## Technologies Used

*   **Frontend:** React, Vite, React Router, Three.js, Cesium, Leaflet
*   **Backend:** Node.js, Express, MongoDB, Neo4j, Redis, WebSockets,  (python-flask for image overlay)
*   **Libraries:** axios, bcrypt, jsonwebtoken, mongoose, neo4j-driver, redis, satellite.js, winston, ws, resium, react-spinners, react-toastify, react-icons, leaflet
*   **Python:** Flask, Sentinel Hub, eolearn, qdrant, Pillow, Scikit Image
*   **Other:** Streamlit for collision detection

## Setup Instructions

Before running the application, make sure you have the following installed:

*   Node.js (>= 16)
*   npm or yarn
*   Python (for image overlay module)
*   MongoDB
*   Neo4j
* Redis

### 1. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file in the `backend` directory** and add the following credentials:
    ```env
    PORT=3000
    MONGODB_URI=<YOUR_MONGODB_CONNECTION_STRING>
    MONGODB_DB_NAME=<YOUR_MONGODB_DATABASE_NAME>
    NEO4J_URI=<YOUR_NEO4J_URI>
    NEO4J_USER=<YOUR_NEO4J_USERNAME>
    NEO4J_PASSWORD=<YOUR_NEO4J_PASSWORD>
    REDIS_URL=<YOUR_REDIS_URL>
    REDIS_PORT=<YOUR_REDIS_PORT>
    N2YO_API_KEY=<YOUR_N2YO_API_KEY>
    ```
    *   Replace the placeholders with your actual database connection details.
    *   Get the N2YO_API_KEY from [https://www.n2yo.com](https://www.n2yo.com)
4.  **Start the backend server:**
    ```bash
    npm run dev
    ```

### 2. Image Overlay API Setup (Python)

1. **Navigate to the api directory:**
   ```bash
    cd Image Overlay/api
content_copy
download
Use code with caution.
Markdown

Install Python dependencies:

pip install -r requirements.txt
content_copy
download
Use code with caution.
Bash

Create a .env file in the Image Overlay/api directory and add the following credentials:

CLIENT_ID=<YOUR_SENTINEL_HUB_CLIENT_ID>
CLIENT_SECRET=<YOUR_SENTINEL_HUB_CLIENT_SECRET>
INSTANCE_ID=<YOUR_SENTINEL_HUB_INSTANCE_ID>
INSTANCE_ID2=<YOUR_SENTINEL_HUB_INSTANCE_ID2>
WEATHER_API=<YOUR_OPENWEATHERMAP_API_KEY>
content_copy
download
Use code with caution.
Env

Get the CLIENT_ID, CLIENT_SECRET and INSTANCE_ID from Sentinel Hub.

Get the WEATHER_API from OpenWeatherMap.

Run the Flask API

python satellite_backend.py
content_copy
download
Use code with caution.
Bash
3. Frontend Setup

Navigate to the frontend directory:

cd frontend_vite
content_copy
download
Use code with caution.
Bash

Install dependencies:

npm install
content_copy
download
Use code with caution.
Bash

Create a .env file in the frontend_vite directory and add the following variable:

VITE_REACT_APP_SOCKET_URL=ws://localhost:3000
content_copy
download
Use code with caution.
Env

Set VITE_REACT_APP_SOCKET_URL to match your backend WebSocket port. Replace 3000 with the port your backend server is listening on.

Start the frontend app:

npm run dev
content_copy
download
Use code with caution.
Bash
4. ADS/Satellite Collision Detection Setup

Navigate to the ADS/satellite collision directory:

cd ADS/satellite collision
content_copy
download
Use code with caution.
Bash

Install the required python libraries:

pip install -r requirements.txt
content_copy
download
Use code with caution.
Bash

Run the app.py file using streamlit:

streamlit run app.py
content_copy
download
Use code with caution.
Bash
Important Notes

Make sure your MongoDB, Neo4j and Redis instances are running before starting the backend server.

Replace all placeholder values (e.g., database URIs, API keys, etc.) in the .env files with your actual data.

The project is designed to pull data from online sources, make sure you have a working internet connection.

Contributing

If you would like to contribute to this project, please feel free to submit a pull request with your proposed changes.

License

This project is licensed under the MIT License.

![image](https://github.com/user-attachments/assets/10adf87c-40d0-408e-b5b6-1de2dc02cdfe)
