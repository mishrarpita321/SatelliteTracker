import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; 

const Navbar = ({ authenticated, handleLogout }) => {
    const icon = "satellite.png";
    
    return (
        <>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
          <nav className="navbar">
            <ul className="custom-links">
              <li className="profile-picture">
                <img src={`/${icon}`} alt="Image" />
              </li>
              {authenticated && (
                <>
                  <li><Link to="/" ><i className="fa fa-home " aria-hidden="true"></i></Link></li>
                  <li><Link to="#" onClick={handleLogout}>Logout</Link></li>
                </>
              )}
              {!authenticated && <li><Link to="/login">Login</Link></li>}
            </ul>
          </nav>
        </>
      );
    };
    
    export default Navbar;