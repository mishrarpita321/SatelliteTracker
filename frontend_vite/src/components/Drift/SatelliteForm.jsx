// src/components/SatelliteForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
const { handleMessage } = useWebSocket();

// import './SatelliteForm.css';

const SatelliteForm = ({ satPositions }) => {
    const [formData, setFormData] = useState({
        OBJECT_NAME: '',
        norad_id: '',
        epoch: '',
        mean_motion: '',
        eccentricity: '',
        inclination: '',
    });

    useEffect(() => {
        setFormData({
            OBJECT_NAME: '',
            norad_id:'',
            epoch: '',
            mean_motion: '',
            eccentricity: '',
            inclination: ''
        });
    }, [satPositions]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log('formData', formData);
        setFormData({
            ...formData,
            [name]: value
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('formData on submit:', formData);
        const numericalData = {
            ...formData,
            mean_motion: parseFloat(formData.mean_motion),
            inclination: parseFloat(formData.inclination),
            eccentricity: parseFloat(formData.eccentricity)
        };
        try {
            const response = await axios.post('http://localhost:3000/api/drift/check-drift', numericalData);
            handleMessage({
                type: 'notification',
                message: response.data.message
            });
            alert(response.data.message);
        } catch (error) {
            console.error('Error checking drift:', error);
            alert('Error checking drift');
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <h3>Simulate Drift</h3>
                    <label>Mean Motion:</label>
                    <input
                        type="number"
                        step="0.0001"
                        name="mean_motion"
                        value={formData.mean_motion}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Inclination:</label>
                    <input
                        type="number"
                        step="0.0001"
                        name="inclination"
                        value={formData.inclination}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Eccentricity:</label>
                    <input
                        type="number"
                        step="0.0001"
                        name="eccentricity"
                        value={formData.eccentricity}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit" className="submit-btn">Check Drift</button>
            </form>
        </div>
    );
};

export default SatelliteForm;
