import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin_panel.css';
import Notification from './Notification';

function AdminPanel() {
    const [activeComplaints, setActiveComplaints] = useState({});
    const [completedComplaints, setCompletedComplaints] = useState({});
    const [complaintCounts, setComplaintCounts] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [notification, setNotification] = useState({ message: null, type: 'error' });
    const navigate = useNavigate();
    const backendUrl = "http://localhost:8001";
    const access_token = localStorage.getItem("access_token");

    const showNotification = (message, type = 'error') => {
        setNotification({ message, type });
    };

    const hideNotification = () => {
        setNotification({ message: null, type: 'error' });
    };

    const loadComplaints = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${backendUrl}/admin/admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                showNotification(error.detail || 'Ошибка загрузки жалоб', 'error');
                return;
            }

            const data = await response.json();
            console.log('Загружены жалобы:', data);
            
            if (data.message === "No Complaints found") {
                setActiveComplaints({});
                setCompletedComplaints({});
            } else {
                setActiveComplaints(data.active_complaints || {});
                setCompletedComplaints(data.completed_complaints || {});
            }
        } catch (err) {
            showNotification('Ошибка сети: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadComplaintCounts = async () => {
        try {
            const response = await fetch(`${backendUrl}/admin/complaints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Загружен счетчик жалоб:', data);
                console.log('Структура данных счетчика:', data);
                console.log('Ключи в data:', Object.keys(data));
                setComplaintCounts(data);
            } else {
                const error = await response.json();
                console.error('Ошибка загрузки счетчика:', error);
            }
        } catch (err) {
            console.error('Ошибка загрузки счетчика жалоб:', err);
        }
    };

    useEffect(() => {
        loadComplaints();
        loadComplaintCounts();
    }, []);

    const handleEditComplaint = async (complaintId, option) => {
        try {
            const response = await fetch(`${backendUrl}/admin/${option}/${complaintId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                showNotification(error.detail || 'Ошибка выполнения операции', 'error');
                return;
            }

            showNotification('Операция выполнена успешно', 'success');
            await loadComplaints();
            await loadComplaintCounts();
        } catch (err) {
            showNotification('Ошибка сети: ' + err.message, 'error');
        }
    };

    const openComplaintDetails = (complaint) => {
        setSelectedComplaint(complaint);
        setShowDetails(true);
    };

    const closeComplaintDetails = () => {
        setShowDetails(false);
        setSelectedComplaint(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (err) {
            return dateString;
        }
    };

    const getComplaintTypeLabel = (type) => {
        const types = {
            'chat': 'Жалоба на переписку',
            'profile': 'Жалоба на профиль',
            'request': 'Жалоба на заявку',
            'onwait': 'В ожидании',
            'pending': 'На рассмотрении',
            'closed': 'Закрыто',
        };
        return types[type] || type;
    };

    const getStatusLabel = (status) => {
        const statuses = {
            'pending': 'На рассмотрении',
            'closed': 'Закрыто',
            'onwait': 'В ожидании',
        };
        return statuses[status] || status;
    };

    return (
        <div className="admin-panel-container">
            <div className="admin-header">
                <h1 className="admin-title">Панель администратора</h1>
                <button
                    className="admin-back-button"
                    onClick={() => navigate(-1)}
                >
                    ← Назад
                </button>
            </div>

            <div className="admin-content">
                
                <div className="admin-stats">
                    <div className="stat-card">
                        <div className="stat-value">{Object.keys(activeComplaints).length}</div>
                        <div className="stat-label">Активных жалоб</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{Object.keys(completedComplaints).length}</div>
                        <div className="stat-label">Завершенных жалоб</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{complaintCounts.chat || 0}</div>
                        <div className="stat-label">На переписку</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{complaintCounts.profile || 0}</div>
                        <div className="stat-label">На профиль</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{complaintCounts.request || 0}</div>
                        <div className="stat-label">На заявку</div>
                    </div>
                </div>

                
                <div className="admin-actions">
                    <button
                        className="admin-refresh-button"
                        onClick={loadComplaints}
                        disabled={loading}
                    >
                        {loading ? 'Загрузка...' : 'Обновить'}
                    </button>
                </div>

                
                <div className="admin-section">
                    <h2 className="section-title">Активные жалобы</h2>
                    {loading ? (
                        <div className="loading-state">Загрузка...</div>
                    ) : Object.keys(activeComplaints).length === 0 ? (
                        <div className="empty-state">Нет активных жалоб</div>
                    ) : (
                        <div className="complaints-grid">
                            {Object.entries(activeComplaints).map(([id, complaint]) => (
                                <div key={id} className="complaint-card">
                                    <div className="complaint-header">
                                        <span className="complaint-id">#{complaint.id}</span>
                                        <span className={`complaint-status status-${complaint.status}`}>
                                            {getStatusLabel(complaint.status)}
                                        </span>
                                    </div>
                                    <div className="complaint-body">
                                        <p className="complaint-type">
                                            {getComplaintTypeLabel(complaint.complaint_type)}
                                        </p>
                                        <p className="complaint-text">
                                            {complaint.complaint_text || complaint.details || 'Нет описания'}
                                        </p>
                                        <div className="complaint-meta">
                                            <span>Жалобщик: #{complaint.complainant_id}</span>
                                            <span>Подозреваемый: #{complaint.suspect_id}</span>
                                        </div>
                                        <p className="complaint-date">
                                            {formatDate(complaint.created_at)}
                                        </p>
                                    </div>
                                    <div className="complaint-actions">
                                        <button
                                            className="complaint-details-button"
                                            onClick={() => openComplaintDetails(complaint)}
                                        >
                                            Подробнее
                                        </button>
                                        {complaint.status === 'pending' && (
                                            <button
                                                className="complaint-action-button action-complete"
                                                onClick={() => handleEditComplaint(complaint.id, 'complete')}
                                            >
                                                Завершить
                                            </button>
                                        )}
                                        <button
                                            className="complaint-action-button action-delete"
                                            onClick={() => handleEditComplaint(complaint.id, 'delete')}
                                        >
                                            Удалить
                                        </button>
                                        
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                
                <div className="admin-section">
                    <h2 className="section-title">Завершенные жалобы</h2>
                    {Object.keys(completedComplaints).length === 0 ? (
                        <div className="empty-state">Нет завершенных жалоб</div>
                    ) : (
                        <div className="complaints-grid">
                            {Object.entries(completedComplaints).map(([id, complaint]) => (
                                <div key={id} className="complaint-card complaint-completed">
                                    <div className="complaint-header">
                                        <span className="complaint-id">#{complaint.id}</span>
                                        <span className="complaint-status status-closed">
                                            {getStatusLabel(complaint.status)}
                                        </span>
                                    </div>
                                    <div className="complaint-body">
                                        <p className="complaint-type">
                                            {getComplaintTypeLabel(complaint.complaint_type)}
                                        </p>
                                        <p className="complaint-text">
                                            {complaint.complaint_text || complaint.details || 'Нет описания'}
                                        </p>
                                        {complaint.admin_verdict && (
                                            <p className="complaint-verdict">
                                                <strong>Вердикт админа:</strong> {complaint.admin_verdict}
                                            </p>
                                        )}
                                        <div className="complaint-meta">
                                            <span>Жалобщик: #{complaint.complainant_id}</span>
                                            <span>Подозреваемый: #{complaint.suspect_id}</span>
                                        </div>
                                        <p className="complaint-date">
                                            {formatDate(complaint.created_at)}
                                        </p>
                                    </div>
                                    <div className="complaint-actions">
                                        <button
                                            className="complaint-details-button"
                                            onClick={() => openComplaintDetails(complaint)}
                                        >
                                            Подробнее
                                        </button>
                                        <button
                                            className="complaint-action-button action-delete"
                                            onClick={() => handleEditComplaint(complaint.id, 'delete')}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            
            {showDetails && selectedComplaint && (
                <div className="complaint-details-overlay" onClick={closeComplaintDetails}>
                    <div className="complaint-details-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="complaint-details-close" onClick={closeComplaintDetails}>
                            ×
                        </button>
                        <h2 className="complaint-details-title">Детали жалобы #{selectedComplaint.id}</h2>
                        <div className="complaint-details-content">
                            <div className="detail-row">
                                <strong>Тип жалобы:</strong>
                                <span>{getComplaintTypeLabel(selectedComplaint.complaint_type)}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Статус:</strong>
                                <span className={`complaint-status status-${selectedComplaint.status}`}>
                                    {getStatusLabel(selectedComplaint.status)}
                                </span>
                            </div>
                            <div className="detail-row">
                                <strong>Жалобщик:</strong>
                                <span>#{selectedComplaint.complainant_id}</span>
                            </div>
                            <div className="detail-row">
                                <strong>Подозреваемый:</strong>
                                <span>#{selectedComplaint.suspect_id}</span>
                            </div>
                            {selectedComplaint.request_id && (
                                <div className="detail-row">
                                    <strong>ID заявки:</strong>
                                    <span>#{selectedComplaint.request_id}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <strong>Текст жалобы:</strong>
                                <span>{selectedComplaint.complaint_text || 'Не указан'}</span>
                            </div>
                            <div className="detail-row-full">
                                <strong>Детали:</strong>
                                <div className="detail-text">
                                    {typeof selectedComplaint.details === 'string' 
                                        ? selectedComplaint.details 
                                        : JSON.stringify(selectedComplaint.details, null, 2)}
                                </div>
                            </div>
                            {selectedComplaint.ai_response && (
                                <div className="detail-row-full">
                                    <strong>Ответ ИИ:</strong>
                                    <div className="detail-text">
                                        {typeof selectedComplaint.ai_response === 'string'
                                            ? selectedComplaint.ai_response
                                            : JSON.stringify(selectedComplaint.ai_response, null, 2)}
                                    </div>
                                </div>
                            )}
                            {selectedComplaint.admin_verdict && (
                                <div className="detail-row">
                                    <strong>Вердикт админа:</strong>
                                    <span>{selectedComplaint.admin_verdict}</span>
                                </div>
                            )}
                            {selectedComplaint.admin_id && (
                                <div className="detail-row">
                                    <strong>ID администратора:</strong>
                                    <span>#{selectedComplaint.admin_id}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <strong>Дата создания:</strong>
                                <span>{formatDate(selectedComplaint.created_at)}</span>
                            </div>
                        </div>
                        <button className="complaint-details-close-button" onClick={closeComplaintDetails}>
                            Закрыть
                        </button>
                    </div>
                </div>
            )}

            {notification.message && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={hideNotification}
                    duration={5000}
                />
            )}
        </div>
    );
}

export default AdminPanel;

