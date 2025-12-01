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
    const FormatText = (text, maxLength = 20) => {
        if (!text) return text;
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
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
                            <p> <strong>{serviceStatus[request.status]} </strong></p>
                            <p> <strong>Тип услуги:</strong> {serviceType[request.service_type]}</p>
                            <p><strong>Адрес:</strong> {FormatText(request.address)}</p>
                            <p>
                                <strong>Комментарий: {" "} </strong>
                                {FormatText(request.comment) || "Нет комментария"}
                            </p>
                            <p><strong>Желаемое время:</strong> {timeString}</p>
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
                <Link to={"/profile"} className="link-to-profile">
                    Профиль
                </Link>
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
                                <span className={`chat-status ${isConnected ? "online" : "offline"}`}>
                                    {isConnected ? "в сети" : "нет подключения"}
                                </span>
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
        </div>
    );
}

export default HomePage;