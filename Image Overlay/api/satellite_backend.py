import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from eolearn.core import EOPatch, FeatureType
from eolearn.io import SentinelHubInputTask
from eolearn.mask.extra.cloud_mask import CloudMaskTask
from sentinelhub import BBox, CRS, DataCollection, SHConfig
from PIL import Image, ImageDraw, ImageEnhance
from qdrant_client import QdrantClient
from qdrant_client.http import models
from torchvision import models as tv_models, transforms
import torch
import numpy as np
import hashlib
from skimage.transform import resize
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import requests
from dotenv import load_dotenv

load_dotenv()

print(DataCollection.__members__)
os.environ['PROJ_LIB'] = os.path.join(os.environ['CONDA_PREFIX'], 'Library', 'share', 'proj')
satellite_backend = Flask(__name__)
CORS(satellite_backend, origins=['http://localhost:3000','http://localhost:5173'])  

# Initialize Qdrant client for storing feature vectors
qdrant_client = QdrantClient("http://localhost:6333")

# Sentinel Hub credential configuration
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')
instance_id = os.getenv('INSTANCE_ID')
instance_id2 = os.getenv('INSTANCE_ID2')

# Initialize geocoder with a higher timeout
geolocator = Nominatim(user_agent="my_geocoder", timeout=10)

# Open Weather API configuration credentials
weather_api_key =os.getenv('WEATHER_API')
weather_api_url = 'http://api.openweathermap.org/data/2.5/weather'

def geocode_location(location_name):
    retries = 3
    for attempt in range(retries):
        try:
            return geolocator.geocode(location_name)
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            print(f"Geocoding attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                continue
            else:
                raise e

def get_weather_data(lat, lon, api_key):
    try:
        response = requests.get(weather_api_url, params={'lat': lat, 'lon': lon, 'appid': api_key, 'units': 'metric'})
        response.raise_for_status()
        data = response.json()
        return {
            'temperature': data['main']['temp'],
            'humidity': data['main']['humidity'],
            'condition': data['weather'][0]['description']
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {str(e)}")
        return None

@satellite_backend.route('/api/eopatch', methods=['POST'])
def get_eopatch():
    try:
        data = request.json
        location_name = data.get('location')
        time_interval = data.get('timeInterval')

        if not location_name or not time_interval:
            return jsonify({'error': 'Missing required data'}), 400

        location = geocode_location(location_name)
        if not location:
            return jsonify({'error': 'Location not found'}), 404

        latitude = location.latitude
        longitude = location.longitude

        weather_data = get_weather_data(latitude, longitude, weather_api_key)
        if not weather_data:
            return jsonify({'error': 'Failed to retrieve weather data'}), 500

        bbox_size = 0.2  # 0.2 degrees is approximately 22 km

        # Definition of the bounding box as per Sentinel Hub's BBox class
        bbox_config = BBox(bbox=(longitude - bbox_size / 2, latitude - bbox_size / 2,
                          longitude + bbox_size / 2, latitude + bbox_size / 2), crs=CRS.WGS84)

        config = SHConfig()
        config.instance_id = instance_id2
        config.sh_client_id = client_id
        config.sh_client_secret = client_secret

        input_task = SentinelHubInputTask(
            data_collection=DataCollection.SENTINEL2_L1C,
            bands_feature=(FeatureType.DATA, 'BANDS-S2-L1C'),
            additional_data=[(FeatureType.MASK, 'CLM'), (FeatureType.MASK, 'CLP'), (FeatureType.MASK, 'dataMask')],
            resolution=10,
            config=config
        )

        eopatch = EOPatch()

        eopatch = input_task.execute(eopatch=eopatch, bbox=bbox_config, time_interval=time_interval)
        print("Available features in the eopatch:", eopatch)

        # Cloud mask task
        cloud_mask_task = CloudMaskTask(
            data_feature=(FeatureType.DATA, 'BANDS-S2-L1C'),
            valid_data_feature=(FeatureType.MASK, 'CLM'),
            output_mask_feature=(FeatureType.MASK, 'CLOUD_MASK'),
            threshold=0.4,
            average_over=4,
            dilation_size=2
        )

        eopatch = cloud_mask_task.execute(eopatch=eopatch)

        print("Available features in the eopatch:", eopatch.get_features())

        image_array = eopatch.data['BANDS-S2-L1C'][0, ..., :3]
        cloud_mask = eopatch.mask['CLOUD_MASK'][0, ..., 0]
        
        print("Image array shape:", image_array.shape)
        print("Cloud mask shape:", cloud_mask.shape)

        # Check if the shapes are compatible
        if image_array.shape[:2] != cloud_mask.shape:
            cloud_mask_resized = resize(cloud_mask, image_array.shape[:2], preserve_range=True)
            cloud_mask_resized = (cloud_mask_resized > 0.5).astype(np.uint8)
            print("Resized cloud mask shape:", cloud_mask_resized.shape)
            cloud_mask = cloud_mask_resized

        print("Shapes after resizing if needed:")
        print("Image array shape:", image_array.shape)
        print("Cloud mask shape:", cloud_mask.shape)

        normalized_image = (image_array - image_array.min()) / (image_array.max() - image_array.min()) * 255

        image_array_uint8 = normalized_image.astype(np.uint8)

        satellite_image = Image.fromarray(image_array_uint8)

        cloud_overlay = Image.fromarray((cloud_mask * 255).astype(np.uint8))

        satellite_image = satellite_image.resize((512, 512), Image.NEAREST)
        cloud_overlay = cloud_overlay.resize((512, 512), Image.NEAREST)

        sat_img = os.path.join('static', 'satellite_image.png')
        satellite_image.save(sat_img)
        cld_img = os.path.join('static', 'cloud_overlay.png')
        cloud_overlay.save(cld_img)

        cloud_overlay = ImageEnhance.Brightness(cloud_overlay).enhance(0.5)
        cloud_overlay = cloud_overlay.convert("RGBA")
        datas = cloud_overlay.getdata()
        new_data = []
        for item in datas:
            if item[0] > 0:
                new_data.append((255, 255, 255, 150)) 
            else:
                new_data.append((255, 255, 255, 0))
        cloud_overlay.putdata(new_data)

        satellite_image = satellite_image.convert("RGBA")

        combined_image = Image.alpha_composite(satellite_image, cloud_overlay)

        draw = ImageDraw.Draw(combined_image)
        draw.text((10, 10), location_name, fill="white")
        draw.text((10, 30), f"Latitude: {latitude}", fill="white")
        draw.text((10, 50), f"Longitude: {longitude}", fill="white")
        draw.text((10, 70), f"Temperature: {weather_data['temperature']}°C", fill="white")
        draw.text((10, 90), f"Humidity: {weather_data['humidity']}%", fill="white")
        draw.text((10, 110), f"Condition: {weather_data['condition']}", fill="white")

        overlay_image_path = os.path.join('static', 'weather_overlay.png')
        combined_image.save(overlay_image_path)

        model = tv_models.resnet50(pretrained=True)
        model.eval()

        preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        input_tensor = preprocess(combined_image.convert("RGB")) 
        input_batch = input_tensor.unsqueeze(0)

        with torch.no_grad():
            features = model(input_batch)

        features = features.numpy().flatten().tolist()

        collection_name = 'satellite_images'
        if collection_name not in [col.name for col in qdrant_client.get_collections().collections]:
            qdrant_client.create_collection(collection_name=collection_name, vectors_config=models.VectorParams(size=len(features), distance=models.Distance.COSINE))

        metadata = {"Location": location_name, "Start Date": time_interval[0], "End Date": time_interval[1], "Temperature": weather_data['temperature'], "Humidity": weather_data['humidity'], "Condition": weather_data['condition']}

        qdrant_client.upsert(
            collection_name=collection_name,
            points=[
                models.PointStruct(id=hashlib.md5(str(features).encode()).hexdigest(), vector=features, payload=metadata)
            ]
        )

        return jsonify({
        'weather_overlay': overlay_image_path,
        'cloud_overlay': cld_img,
        'satellite_image': sat_img
    })

    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    satellite_backend.run(debug=True, port=5000)