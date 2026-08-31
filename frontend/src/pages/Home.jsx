import React, { useEffect, useState } from 'react';
import WelcomeCard from '../components/WelcomeCard';
import CityHeatmap from '../components/CityHeatmap';
import RegisteredPanel from '../components/RegisteredPanel';
import ResolvedPanel from '../components/ResolvedPanel';
import Toast from '../components/Toast';
import { API_BASE_URL } from '../config';
import './Home.css';

const Home = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Responsive mobile screen check
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile accordion states - default Registered Complaints open on mobile
  const [isRegisteredOpen, setIsRegisteredOpen] = useState(true);
  const [isResolvedOpen, setIsResolvedOpen] = useState(false);

  // Live search filtering states
  const [pendingSearch, setPendingSearch] = useState('');
  const [resolvedSearch, setResolvedSearch] = useState('');
  
  const [toast, setToast] = useState({ message: '', type: '' });

  const fetchComplaints = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/public/complaints`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response failure');
        return res.json();
      })
      .then((data) => {
        setComplaints(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to stream live civic data feed:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints based on status
  const pendingComplaints = complaints.filter(
    item => (item.status || '').toLowerCase() === 'pending' || (item.status || '').toLowerCase() === 'pending verification'
  );
  
  const resolvedComplaints = complaints.filter(
    item => (item.status || '').toLowerCase() === 'resolved'
  );

  // Filtered by Search Terms
  const filteredPending = pendingComplaints.filter(item => {
    const term = pendingSearch.toLowerCase();
    return (
      (item.description || '').toLowerCase().includes(term) ||
      (item.department || '').toLowerCase().includes(term) ||
      (item.landmark || '').toLowerCase().includes(term) ||
      (item.complaint_no || '').toString().includes(term)
    );
  });

  const filteredResolved = resolvedComplaints.filter(item => {
    const term = resolvedSearch.toLowerCase();
    return (
      (item.description || '').toLowerCase().includes(term) ||
      (item.department || '').toLowerCase().includes(term) ||
      (item.landmark || '').toLowerCase().includes(term) ||
      (item.complaint_no || '').toString().includes(term)
    );
  });

  return (
    <div className="home-page-container">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: '' })}
      />

      <header className="brand-header">
        <div className="logo-group">
          <span className="brand-name">CivicSense</span>
        </div>
        <div className="header-right-zone">
          <div className="brand-badge-info">
            <span className="pulse-indicator"></span> Mangaluru live feed
          </div>
        </div>
      </header>

      <div className="home-dashboard">
        {/* LEFT COLUMN: REGISTERED COMPLAINTS */}
        <aside className={`side-column left-column ${isRegisteredOpen ? 'is-open' : 'is-collapsed'}`}>
          <div className="column-header" onClick={() => setIsRegisteredOpen(!isRegisteredOpen)}>
            <div className="header-title-row">
              <h2>Registered Complaints</h2>
              <span className="badge pending-count">{pendingComplaints.length} Open</span>
            </div>
          </div>

          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search active complaints..."
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              className="feed-search-input"
            />
          </div>

          <div className="scrollable-feed">
            {loading ? (
              <div className="panel-loading">Loading feed...</div>
            ) : (
              <RegisteredPanel complaints={filteredPending} />
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: MAP & WELCOME (Omitted on Mobile Screens) */}
        {!isMobile ? (
          <main className="center-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflow: 'hidden' }}>
            <div className="welcome-card-wrapper" style={{ flexShrink: 0 }}>
              <WelcomeCard />
            </div>
            <div className="home-map-section" style={{ 
              background: '#ffffff', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--card-border)', 
              padding: '16px', 
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              overflow: 'hidden',
              minHeight: '220px'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px', marginTop: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                Live Grievance Map Telemetry
              </h3>
              <CityHeatmap points={complaints} />
            </div>
          </main>
        ) : (
          <div className="mobile-welcome-card-wrapper" style={{ padding: '0 12px 12px 12px' }}>
            <WelcomeCard />
          </div>
        )}

        {/* RIGHT COLUMN: RESOLVED COMPLAINTS */}
        <aside className={`side-column right-column ${isResolvedOpen ? 'is-open' : 'is-collapsed'}`}>
          <div className="column-header" onClick={() => setIsResolvedOpen(!isResolvedOpen)}>
            <div className="header-title-row">
              <h2>Resolved Complaints</h2>
              <span className="badge resolved-count">{resolvedComplaints.length} Fixed</span>
            </div>
            <span className="collapse-arrow">{isResolvedOpen ? '▼' : '▲'}</span>
          </div>

          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search resolved complaints..."
              value={resolvedSearch}
              onChange={(e) => setResolvedSearch(e.target.value)}
              className="feed-search-input"
            />
          </div>

          <div className="scrollable-feed">
            {loading ? (
              <div className="panel-loading">Loading feed...</div>
            ) : (
              <ResolvedPanel complaints={filteredResolved} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;