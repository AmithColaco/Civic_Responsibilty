// src/components/CityHeatmap.jsx
import './leaflet-globals'; // Bind window.L before importing leaflet plugins
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

const getDepartmentColor = (dept) => {
  const d = (dept || '').toLowerCase();
  if (d.includes('mescom')) return '#ef4444';
  if (d.includes('sewage') || d.includes('water')) return '#06b6d4';
  if (d.includes('animal') || d.includes('welfare') || d.includes('health')) return '#10b981'; // Green
  if (d.includes('mcc')) return '#f59e0b';
  return '#6366f1';
};

const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    const heatData = points
      .filter((p) => {
        const lat = parseFloat(p.latitude);
        const lon = parseFloat(p.longitude);
        return !isNaN(lat) && !isNaN(lon);
      })
      .map((p) => [
        parseFloat(p.latitude),
        parseFloat(p.longitude),
        0.5
      ]);

    if (heatData.length === 0) return;

    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: '#3b82f6',
        0.6: '#eab308',
        1.0: '#ef4444'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

const CityHeatmap = ({ points }) => {
  const defaultCenter = [12.9141, 74.8560];
  const defaultZoom = 13;

  return (
    <div className="map-wrapper-inner" style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="leaflet-map-container"
        style={{ height: '100%', width: '100%', flexGrow: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer points={points} />

        {points && points.map((complaint) => {
          const lat = parseFloat(complaint.latitude);
          const lon = parseFloat(complaint.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <CircleMarker
              key={complaint.id || complaint.complaint_no}
              center={[lat, lon]}
              radius={8}
              fillColor={getDepartmentColor(complaint.department)}
              color="#ffffff"
              weight={1.5}
              fillOpacity={0.8}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', width: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '14px', color: '#1e1b4b' }}>#CS-{complaint.complaint_no}</strong>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      backgroundColor: complaint.status === 'Resolved' ? '#d1fae5' : '#fee2e2',
                      color: complaint.status === 'Resolved' ? '#065f46' : '#991b1b'
                    }}>
                      {complaint.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: '700', color: getDepartmentColor(complaint.department), fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {complaint.department}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500', marginBottom: '8px' }}>
                    📍 {complaint.landmark}
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: '#374151', lineHeight: '1.4' }}>
                    {complaint.description ? (complaint.description.slice(0, 120) + (complaint.description.length > 120 ? '...' : '')) : 'No description provided.'}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default CityHeatmap;
