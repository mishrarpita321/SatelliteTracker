import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ setAuthenticated }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/astronautRoutes/login', { username, password });
            localStorage.setItem('token', response.data.token);
            setAuthenticated(true);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="login-wrap">
            <h1 className="custom-title">Login</h1>
            <form className="login-form" onSubmit={handleSubmit}>
                <div>
                    <input type="text" className="login-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div>
                    <input type="password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p>{error}</p>}
                <button className="login-button" type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
