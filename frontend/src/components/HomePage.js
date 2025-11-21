import { React, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/home_page.css";

function HomePage() {
    const [activeRequests, setActiveRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDetailedOpen, setIsDetailedOpen] = useState(false);
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

    useEffect(() => {
        getRequests();
    }, []);

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
        window.location.reload();
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
        window.location.reload();
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
        window.location.reload();
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
                        className="request-detailed"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                        {role === "user" ? (
                            <div>
                                <button onClick={async () => deleteRequest(selectedRequest.id)}>Удалить</button>
                                <button onClick={async () => confirmCompletion(selectedRequest.id)}>Подтвердить выполнение</button>
                            </div>
                        ): (
                            <div>
                                <button onClick={async () => cancelRequest(selectedRequest.id)}>Отказаться</button>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}

export default HomePage;