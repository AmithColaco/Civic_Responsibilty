import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/home.css';

const WelcomeCard = () => {
  return (
    <div className="civic-card">
      <div className="civic-tag">CITIZEN GRIEVANCE PORTAL</div>
      <h1 className="civic-title">CivicSense</h1>
      <p className="civic-subtitle">
        Bridging the gap between citizens and municipal administration. Report issues instantly, skip the red tape, and track verified community updates.
      </p>

      <div className="button-group">
        <Link to="/register" className="btn-nav btn-reg">
          Register Profile
        </Link>
        <Link to="/login" className="btn-nav btn-log">
          Login to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default WelcomeCard;