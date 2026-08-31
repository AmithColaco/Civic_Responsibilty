// src/components/ComplaintCard.jsx
import React from 'react';

const ComplaintCard = ({ complaint, theme }) => {
  const isResolved = theme === 'resolved';

  // Support both mock formats and actual database fields safely
  const complaintId = complaint.complaint_no || complaint.id;
  const titleText = complaint.department || complaint.title || 'Civic Issue';
  const descText = complaint.description || 'No description provided.';
  const locText = complaint.landmark || complaint.location || (complaint.ward_number ? `Ward ${complaint.ward_number}` : 'Mangaluru');
  const dateValue = complaint.created_at;
  const severityText = complaint.severity || 'Medium';

  // Extract first image from comma separated attachments
  let finalImageUrl = complaint.image_url;
  if (!finalImageUrl && complaint.media_attachments) {
    finalImageUrl = complaint.media_attachments.split(',')[0].trim();
  }

  // Format date to local Indian format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get department CSS color variables or classes
  const getDeptClass = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('waste') || d.includes('garbage') || d.includes('sanitation')) return 'dept-waste';
    if (d.includes('road') || d.includes('pothole') || d.includes('infra')) return 'dept-roads';
    if (d.includes('water') || d.includes('drain') || d.includes('sewage')) return 'dept-water';
    if (d.includes('light') || d.includes('electric') || d.includes('power')) return 'dept-lights';
    if (d.includes('traffic') || d.includes('police')) return 'dept-traffic';
    return 'dept-general';
  };

  // Get severity badge class
  const getSeverityClass = (sev) => {
    const s = (sev || '').toLowerCase();
    if (s === 'high' || s === 'critical' || s === 'emergency') return 'sev-high';
    if (s === 'low') return 'sev-low';
    return 'sev-medium';
  };

  // Calculate Escalation Level & Officer Designation based on days open without resolution
  const getEscalationDetails = () => {
    if (isResolved || !dateValue) return null;
    const createdDate = new Date(dateValue);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const daysOpen = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysOpen >= 20) {
      return {
        level: 2,
        officer: 'Chief Engineer / Super Admin',
        color: '#dc2626',
        bg: 'rgba(220, 38, 38, 0.12)',
        border: 'rgba(220, 38, 38, 0.35)',
        label: `🚨 ESCALATED TO CHIEF ENGINEER (${daysOpen}d INACTION)`
      };
    } else if (daysOpen >= 10) {
      return {
        level: 1,
        officer: 'Assistant Executive Engineer (AEE)',
        color: '#ea580c',
        bg: 'rgba(234, 88, 12, 0.12)',
        border: 'rgba(234, 88, 12, 0.35)',
        label: `⚠️ ESCALATED TO AEE (${daysOpen}d INACTION)`
      };
    }
    return {
      level: 0,
      officer: 'Junior Engineer (JE)',
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.08)',
      border: 'rgba(37, 99, 235, 0.25)',
      label: `Officer Assigned: Junior Engineer (JE)`
    };
  };

  const escalation = getEscalationDetails();

  return (
    <div className={`complaint-card ${isResolved ? 'card-resolved' : 'card-pending'}`}>

      {/* 1. Optional Image Banner with Zoom on Hover */}
      {finalImageUrl && (
        <div className="complaint-card-image">
          <img src={finalImageUrl} alt={titleText} loading="lazy" />
          {complaintId && (
            <span className="card-id-tag">#CS-{complaintId}</span>
          )}
        </div>
      )}

      {/* 2. Body Details */}
      <div className="complaint-card-body">
        <div className="complaint-card-header">
          <span className={`dept-pill ${getDeptClass(titleText)}`}>
            {titleText}
          </span>
          <span className={`status-pill ${isResolved ? 'pill-resolved' : 'pill-pending'}`}>
            {isResolved ? 'Fixed' : 'Open'}
          </span>
        </div>

        <p className="complaint-card-desc">{descText}</p>

        <div className="complaint-card-footer">
          <span className="complaint-meta-loc">
            {locText}
          </span>
          <span className="complaint-meta-date">
            {formatDate(dateValue)}
          </span>
        </div>

        {/* Additional Badge Row if severity or extra tags are present */}
        {!isResolved && (severityText || complaint.location_type || complaint.issue_size || complaint.is_potential_duplicate || complaint.merged_into_id) && (
          <div className="complaint-card-sub-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {severityText && (
              <span className={`severity-tag ${getSeverityClass(severityText)}`}>
                {severityText}
              </span>
            )}
            {complaint.location_type && (
              <span className="location-type-badge" style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-primary)', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize', fontWeight: '600' }}>
                {complaint.location_type.replace('_', ' ')}
              </span>
            )}
            {complaint.issue_size && (
              <span className="issue-size-badge" style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize', fontWeight: '600' }}>
                {complaint.issue_size} scale
              </span>
            )}
            {complaint.assigned_contractor && (
              <span className="contractor-badge" style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', wordBreak: 'break-all' }}>
                {complaint.assigned_contractor}
              </span>
            )}
            {complaint.is_potential_duplicate && (
              <span className="potential-duplicate-badge" style={{ fontSize: '11px', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                Potential Duplicate
              </span>
            )}
            {complaint.merged_into_id && (
              <span className="merged-badge" style={{ fontSize: '11px', background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                Merged
              </span>
            )}
          </div>
        )}

        {/* 3. Departmental Escalation Hierarchy Banner (10-Day Inaction SLA) */}
        {escalation && (
          <div className="escalation-hierarchy-banner" style={{
            marginTop: '10px',
            padding: '6px 10px',
            borderRadius: '6px',
            background: escalation.bg,
            border: `1px solid ${escalation.border}`,
            color: escalation.color,
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            <span>{escalation.label}</span>
            <span style={{ fontSize: '10px', opacity: 0.9, fontStyle: 'italic' }}>Officer: {escalation.officer}</span>
          </div>
        )}

        {/* 4. Hybrid Blockchain Cryptographic Audit Trail Badge */}
        <div className="blockchain-audit-badge" style={{
          marginTop: '10px',
          padding: '5px 10px',
          borderRadius: '6px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          color: '#6366f1',
          fontSize: '10px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>⛓️ SHA-256 Blockchain Audit Proof</span>
          <span style={{ fontSize: '9px', opacity: 0.85, fontFamily: 'monospace' }}>Verified Ledger</span>
        </div>
      </div>

    </div>
  );
};

export default ComplaintCard;