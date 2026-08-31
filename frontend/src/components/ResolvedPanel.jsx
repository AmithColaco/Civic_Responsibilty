// src/components/ResolvedPanel.jsx
import React from 'react';
import ComplaintCard from './ComplaintCard';

const ResolvedPanel = ({ complaints }) => {
  if (!complaints || complaints.length === 0) {
    return (
      <div className="empty-panel-message">
        <p>No complaints resolved yet.</p>
      </div>
    );
  }

  return (
    <div className="panel-cards-container">
      {complaints.map((complaint) => (
        <ComplaintCard 
          key={complaint.id} 
          complaint={complaint} 
          theme="resolved" 
        />
      ))}
    </div>
  );
};

export default ResolvedPanel;