import React, { useEffect } from 'react';
import './toast.css';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        // Automatically trigger the close handler after 5 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;

    return (
        <div className={`toast-notification-box ${type === 'success' ? 'toast-success' : 'toast-error'}`}>
            <div className="toast-content-body">
                <p className="toast-message-text">{message}</p>
                <button className="toast-dismiss-btn" onClick={onClose}>x</button>
            </div>
            {/* The animated horizontal progress countdown bar */}
            <div className="toast-progress-bar-container">
                <div className="toast-progress-bar-fill" />
            </div>
        </div>
    );
};

export default Toast;