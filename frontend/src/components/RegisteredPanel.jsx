// src/components/RegisteredPanel.jsx
import React from 'react';
import ComplaintCard from './ComplaintCard';

const RegisteredPanel = ({ complaints }) => {
  if (!complaints || complaints.length === 0) {
    return (
      <div className="empty-panel-message">
        <p>No pending complaints reported.</p>
      </div>
    );
  }

  return (
    <div className="panel-cards-container">
      {complaints.map((complaint) => (
        <ComplaintCard 
          key={complaint.id} 
          complaint={complaint} 
          theme="pending" 
        />
      ))}
    </div>
  );
};

export default RegisteredPanel;