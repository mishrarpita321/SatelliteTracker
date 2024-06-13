// src/components/SatelliteForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

// import './SatelliteForm.css';

const SatelliteForm = ({ satPositions }) => {
    const [formData, setFormData] = useState({
        OBJECT_NAME: '',
        norad_id: '',
        epoch: new Date().toISOString(),
        mean_motion: '',
        eccentricity: '',
        inclination: '',
    });

    useEffect(() => {
        if (satPositions) {
            setFormData((prevFormData) => ({
                ...prevFormData,
                OBJECT_NAME: satPositions.objectName || '',
                norad_id: satPositions.noradId || ''
            }));
        }
    }, [satPositions]);

    const handleChange = (e) => {
        console.log('formData:', formData);
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value
        }));
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
            // alert(response.data.message);
            const msg = response.data.message;
            toast.error(msg, {
                position: "top-right",
                autoClose: false,
            });
        } catch (error) {
            console.error('Error checking drift:', error);
            alert('Error checking drift');
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Mean Motion:</label>
                    <input
                        type="text"
                        // step="0.0001"
                        name="mean_motion"
                        value={formData.mean_motion}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Inclination:</label>
                    <input
                        type="text"
                        // step="0.0001"
                        name="inclination"
                        value={formData.inclination}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Eccentricity:</label>
                    <input
                        type="text"
                        // step="0.0001"
                        name="eccentricity"
                        value={formData.eccentricity}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit" className="submit-btn">Check Drift</button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default SatelliteForm;
