import { React, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home_page.css";
import Message from "./Message";

function HomePage() {
    const [activeRequests, setActiveRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDetailedOpen, setIsDetailedOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [ws, SetWs] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [requestId, setRequestId] = useState("")
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [complaintText, setComplaintText] = useState("");
    const [complaintType, setComplaintType] = useState("chat");
    const [submittingComplaint, setSubmittingComplaint] = useState(false);
    const [verdictResult, setVerdictResult] = useState(null);
    const role = localStorage.getItem("role");

    const getRequests = async () => {
        const backendUrl = "http://localhost:8001";
        const access_token = localStorage.getItem("access_token");
        setLoading(true);
        try {
            const request = await fetch(backendUrl + `/home/${role}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
            });
            const data = await request.json();
            if (request.status === 200) {
                setActiveRequests(Object.values(data.active_requests || {}));
                setHistoryRequests(Object.values(data.completed_requests || {}));
                setLoading(false);
            }
        } catch (err) {
            setError(err.message);
            return;
        }
    };

    const serviceType = {
        cleaning: "Уборка",
        rubbish: "Вынос мусора",
        delivery_food: "Доставка продуктов",
        delivery_drugs: "Доставка лекарств",
        consultation: "Общение",
        mobility_help: "Помощь в передвижении",
        other: "Другая услуга",
    };
    const serviceStatus = {
        onwait: "Ожидает выполнения",
        in_progress: "В процессе",
        completed: "Завершено",
        cancelled: "Отменено",
    };

    const showDetails = (request) => {
        setSelectedRequest(request);
        setIsDetailedOpen(true);
    };

    const closeDetailed = () => {
        setSelectedRequest(null);
        setIsDetailedOpen(false);
        setRequestId("")
        setMessages([])
        if (ws) {
            ws.close();
            SetWs(null);
        };
        setIsConnected(false);
    };

    const formatDateTime = (value) => {
        if (!value) return "Не указано";
        const dt = new Date(value);
        return dt.toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const deleteRequest = async (requestId) => {
        const backendUrl = "http://localhost:8001";
        const access_token = localStorage.getItem("access_token");
        const request = await fetch(backendUrl + `/home/delete/${requestId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            }
        })
        setIsDetailedOpen(false);
        await getRequests();
    }

    const confirmCompletion = async (requestId) => {
        const backendUrl = "http://localhost:8001";
        const access_token = localStorage.getItem("access_token");
        const request = await fetch(backendUrl + `/home/complete/${requestId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            }
        })
        setIsDetailedOpen(false);
        await getRequests();
    }

    const cancelRequest = async (requestId) => {
        const backendUrl = "http://localhost:8001";
        const access_token = localStorage.getItem("access_token");
        const request = await fetch(backendUrl + `/home/cancel/${requestId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            }
        })
        setIsDetailedOpen(false);
        await getRequests();
    }

    const renderRequests = (list, sectionTitle) => {
        if (!list || list.length === 0) {
            return (
                <div className="empty-state">
                    {sectionTitle === "active"
                        ? "Нет активных заявок"
                        : "История пуста"}
                </div>
            );
        }
        return (
            <div className="requests-grid">
                {list.map((request) => {
                    const timeString = formatDateTime(request.desired_time);
                    return (
                        <div key={request.id} className="request-card">
                            <p>{serviceStatus[request.status]}</p>
                            <p>{serviceType[request.service_type]}</p>
                            <p>Адрес: {request.address}</p>
                            <p>
                                Комментарий{" "}
                                {request.comment || "Нет комментария"}
                            </p>
                            <p>Желаемое время: {timeString}</p>
                            <button
                                className="request-details-button"
                                onClick={() => showDetails(request)}
                                type="button"
                            >
                                Подробнее
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };
    const renderLink = (role) => {
        if (role === "user") {
            return (
                <Link to={"/request"} className="request-button">
                    Новая заявка
                </Link>
            );
        } else if (role === "volunteer") {
            return (
                <Link to={"/request-feed"} className="request-button">
                    Лента заявок
                </Link>
            );
        }
    };

    const getChatHistory = async (requestId) => {
        const access_token = localStorage.getItem("access_token");
        const backendUrl = "http://localhost:8001";
        if (!access_token) {
            setMessages([]);
            return;
        }

        const response = await fetch(backendUrl + `/chat/history/${requestId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
            },
        });
        const data = await response.json();
        setMessages(data.messages || []);
    }

    const sendMessage = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN || !message.trim()) {
            return;
        }
        ws.send(message.trim());
        setMessage('');
    }

    const sendComplaint = async () => {
        if (!complaintText.trim() || !selectedRequest) return;
        
        const backendUrl = "http://localhost:8001";
        const access_token = localStorage.getItem("access_token");
        
        // Determine who to complain about based on role
        const susUserId = role === "user" 
            ? selectedRequest.volunteer_id 
            : selectedRequest.user_id;

        if (!susUserId || susUserId === -1) {
            alert("Невозможно отправить жалобу: нет другого участника");
            return;
        }

        setSubmittingComplaint(true);
        try {
            const response = await fetch(backendUrl + `/complaint/${complaintType}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify({
                    complaint_text: complaintText,
                    sus_user_id: susUserId,
                    request_id: selectedRequest.id
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                setVerdictResult(result);
                setShowComplaintModal(false);
                setComplaintText("");
            } else {
                const error = await response.json();
                alert("Ошибка: " + (error.detail || "Не удалось отправить жалобу"));
            }
        } catch (err) {
            alert("Ошибка сети: " + err.message);
        } finally {
            setSubmittingComplaint(false);
        }
    }

const closeVerdict = async () => {
    if (verdictResult.confidence >= 90) {
        const backendUrl = "http://localhost:8001";
        const access_token = localStorage.getItem("access_token");
        for (const punishment of verdictResult.punishments) {
            if (punishment.verdict !== "innocent") {
                await fetch(backendUrl + `/verdict/${punishment.verdict}/${punishment.user_id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${access_token}`,
                    }
                });
            }
        }
    }
    setVerdictResult(null);
}

    useEffect(() => {
        getRequests();
    }, []);

    useEffect(() => {
        if (!selectedRequest) return;
        const access_token = localStorage.getItem("access_token");
        const socket = new WebSocket(`ws://localhost:8001/ws/${role}/${selectedRequest.id}?access_token=${access_token}`);
        SetWs(socket);
        setRequestId(selectedRequest.id);
        getChatHistory(selectedRequest.id);

        socket.onopen = () => setIsConnected(true);

        socket.onmessage = (event) => {
            const [role, message] = event.data.split("-");
            setMessages(prev => {
                const nextMessages = [...prev, { role, message }];
                return nextMessages;
            });
        };

        socket.onerror = () => {
            console.error("WebSocket error");
            setIsConnected(false);
        };
        socket.onclose = () => setIsConnected(false);

        return () => {
            socket.close();
            SetWs(null);
            setIsConnected(false);
        };
    }, [role, isDetailedOpen, selectedRequest]);

    return (
        <div className="home-page-container">
            <div className="div-header">
                <p className="p-header">Главная</p>
            </div>

            <div className="main-content">
                <div className="section">
                    <p className="p-bold">Активные заявки</p>
                    {loading ? (
                        <p>Загрузка...</p>
                    ) : error ? (
                        <p className="error-text">Ошибка: {error}</p>
                    ) : (
                        renderRequests(activeRequests, "active")
                    )}
                </div>

                <div className="section">
                    <p className="p-bold">История заявок</p>
                    {loading ? (
                        <p>Загрузка...</p>
                    ) : error ? (
                        <p className="error-text">Ошибка: {error}</p>
                    ) : (
                        renderRequests(historyRequests, "history")
                    )}
                </div>

                <div className="button-container">{renderLink(role)}</div>
            </div>

            <div className="footer">
                <p className="footer-text">Связаться с нами</p>
            </div>

            {isDetailedOpen && selectedRequest && (
                <div className="request-detailed-overlay" onClick={closeDetailed}>
                    <div
                        className="request-detailed-layout"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="request-detailed">
                            <button className="detailed-close" onClick={closeDetailed}>
                                ×
                            </button>
                            <h2>
                                Заявка #{selectedRequest.id} (
                                {serviceStatus[selectedRequest.status]})
                            </h2>
                            <p>
                                <strong>Тип услуги: </strong>
                                {serviceType[selectedRequest.service_type]}
                            </p>
                            <p>
                                <strong>Адрес: </strong>
                                {selectedRequest.address}
                            </p>
                            <p>
                                <strong>Комментарий: </strong>
                                {selectedRequest.comment || "Нет комментария"}
                            </p>
                            <p>
                                <strong>Желаемое время: </strong>
                                {formatDateTime(selectedRequest.desired_time)}
                            </p>
                            {role === "user" ? (
                                <p>
                                    <strong>Волонтёр: </strong>
                                    {selectedRequest.volunteer_name || "Не назначен"}
                                </p>
                            ) : (
                                <p>
                                    <strong>Заказчик: </strong>
                                    {selectedRequest.full_name}
                                </p>
                            )}
                            {role === "user" || !(selectedRequest.status === "completed") ? (
                                (!(selectedRequest.status === "completed")) ? (
                                    <div className="detailed-actions">
                                        <button onClick={async () => deleteRequest(selectedRequest.id)}>Удалить</button>
                                        <button onClick={async () => confirmCompletion(selectedRequest.id)}>Подтвердить выполнение</button>
                                    </div>
                                ) : (
                                    <div className="detailed-actions">
                                        <button>Оценить</button>
                                    </div>
                                )
                            ): (
                                (!(selectedRequest.status === "completed")) ? (
                                    <div className="detailed-actions">
                                        <button onClick={async () => cancelRequest(selectedRequest.id)}>Отказаться</button>
                                    </div>
                                ) : (
                                    <div className="detailed-actions">
                                        <button>Оценить</button>
                                    </div>
                                )
                            )}

                        </div>
                        <div className="chat-panel">
                            <div className="chat-header">
                                <p className="chat-title">Чат заявки</p>
                                <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                                    <span className={`chat-status ${isConnected ? "online" : "offline"}`}>
                                        {isConnected ? "в сети" : "нет подключения"}
                                    </span>
                                    <button 
                                        className="complaint-button"
                                        onClick={() => setShowComplaintModal(true)}
                                    >
                                        Пожаловаться
                                    </button>
                                </div>
                            </div>
                            <div className="chat-window">
                                {messages.length === 0 ? (
                                    <p className="chat-empty">Сообщений пока нет</p>
                                ) : (
                                    messages.map((mess, index) => (
                                        <Message key={`${mess.role}-${index}`} mess={mess} />
                                    ))
                                )}
                            </div>
                            <div className="chat-input">
                                <input
                                    type="text"
                                    className="message-input"
                                    value={message}
                                    placeholder="Введите сообщение..."
                                    onChange={e => setMessage(e.target.value)}
                                />
                                <button
                                    className="send-button"
                                    onClick={sendMessage}
                                    disabled={!isConnected || !message.trim() || !(selectedRequest.status === "in_progress") }
                                >
                                    Отправить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showComplaintModal && (
                <div className="request-detailed-overlay" onClick={() => setShowComplaintModal(false)}>
                    <div 
                        className="complaint-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            className="detailed-close" 
                            onClick={() => setShowComplaintModal(false)}
                        >
                            ×
                        </button>
                        <h2>Подать жалобу</h2>
                        <div className="complaint-form">
                            <label>
                                <strong>Тип жалобы:</strong>
                                <select 
                                    value={complaintType} 
                                    onChange={(e) => setComplaintType(e.target.value)}
                                >
                                    <option value="chat">Чат (переписка)</option>
                                    <option value="request">Заявка (выполнение)</option>
                                    <option value="profile">Профиль</option>
                                </select>
                            </label>
                            <label>
                                <strong>Опишите проблему:</strong>
                                <textarea
                                    value={complaintText}
                                    onChange={(e) => setComplaintText(e.target.value)}
                                    placeholder="Подробно опишите причину жалобы..."
                                    rows={5}
                                />
                            </label>
                            <div className="complaint-actions">
                                <button 
                                    onClick={() => setShowComplaintModal(false)}
                                    className="cancel-btn"
                                >
                                    Отмена
                                </button>
                                <button 
                                    onClick={sendComplaint}
                                    disabled={submittingComplaint || !complaintText.trim()}
                                    className="submit-btn"
                                >
                                    {submittingComplaint ? "Отправка..." : "Отправить"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {verdictResult && verdictResult.punishments && (
                <div className="request-detailed-overlay" onClick={() => setVerdictResult(null)}>
                    <div 
                        className="verdict-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            className="detailed-close" 
                            onClick={() => setVerdictResult(null)}
                        >
                            ×
                        </button>
                        
                        <div className="verdict-header">
                            <h2 className="verdict-title">Результат рассмотрения</h2>
                        </div>

                        <div className="verdict-punishments">
                            {verdictResult.punishments.map((p, idx) => (
                                <div key={idx} className={`punishment-item verdict-${p.verdict}`}>
                                    <span className="punishment-icon">
                                        {p.verdict === "ban" && "⛔"}
                                        {p.verdict === "warning" && "⚠️"}
                                        {p.verdict === "innocent" && "✅"}
                                    </span>
                                    <span className="punishment-label">
                                        Пользователь #{p.user_id}:
                                    </span>
                                    <span className="punishment-verdict">
                                        {p.verdict === "ban" && "Бан"}
                                        {p.verdict === "warning" && "Предупреждение"}
                                        {p.verdict === "innocent" && "Невиновен"}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="verdict-confidence">
                            <span className="confidence-label">Уверенность ИИ</span>
                            <div className="confidence-bar-container">
                                <div 
                                    className="confidence-bar"
                                    style={{ width: `${verdictResult.confidence}%` }}
                                />
                            </div>
                            <span className="confidence-value">{verdictResult.confidence}%</span>
                        </div>

                        <div className="verdict-reasoning">
                            <h3>Обоснование</h3>
                            <p>{verdictResult.reasoning_user}</p>
                        </div>

                        <div className="verdict-note">
                            {verdictResult.confidence >= 90 
                                ? "Решение применено автоматически" 
                                : "Жалоба отправлена на ручную проверку"}
                        </div>

                        <button 
                            className="verdict-close-btn"
                            onClick={closeVerdict}
                        >
                            Понятно
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HomePage;