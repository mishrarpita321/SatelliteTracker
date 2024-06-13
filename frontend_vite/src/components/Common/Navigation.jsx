import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; 

const Navbar = () => {
    const icon = "satellite.png";
    
    return (
        <>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
          <nav className="navbar">
            <ul className="custom-links">
              <li className="profile-picture">
                <img src={`/${icon}`} alt="Image" />
              </li>
              <li><Link to="/">Home</Link></li>
            </ul>
          </nav>
        </>
      );
    };
    
    export default Navbar;