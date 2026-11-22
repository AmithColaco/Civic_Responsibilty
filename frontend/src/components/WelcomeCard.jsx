import React from 'react';
import { Link } from 'react-router-dom';
import '../pages/home.css';

const WelcomeCard = () => {
  return (
    <div className="civic-card">
      <div className="civic-tag">Mangaluru, Karnataka</div>
      <h1 className="civic-title">CivicSense</h1>
      <p className="civic-subtitle">
        Report a local issue in under a minute. We route it to the right team and keep you updated until it's fixed.
      </p>

      <div className="button-group">
        <Link to="/register" className="btn-nav btn-reg btn-report-primary">
          Get started — it's free
        </Link>
        <Link to="/login" className="btn-nav btn-log">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default WelcomeCard;