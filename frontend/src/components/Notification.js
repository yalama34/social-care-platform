import React, { useEffect } from 'react';
import '../styles/notification.css';

function Notification({ message, type = 'error', onClose, duration = 5000 }) {
    useEffect(() => {
        if (duration > 0 && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    if (!message) return null;

    return (
        <div className={`notification notification-${type}`}>
            <div className="notification-content">
                <span className="notification-icon">
                    {type === 'error'}
                    {type === 'success'}
                    {type === 'info'}
                    {type === 'warning'}
                </span>
                <span className="notification-message">{message}</span>
            </div>
            {onClose && (
                <button className="notification-close" onClick={onClose}>
                    ×
                </button>
            )}
        </div>
    );
}

export default Notification;
