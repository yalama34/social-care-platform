import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/requestfeed.css';

function RequestFeed() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterTypes, setFilterTypes] = useState([]);
    const [sortOrder, setSortOrder] = useState("newest");

    const backendUrl = "http://localhost:8001";
    const navigate = useNavigate();

    const fetchRequest = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const access_token = localStorage.getItem("access_token");
            
            const response = await fetch(backendUrl + "/request-feed", {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`Ошибка загрузки данных: ${response.status}`);
            }
            
            const data = await response.json();
            
            setRequests(data);
            setLoading(false);
            
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, [backendUrl]);

    useEffect(() => {
        fetchRequest(); 
    }, [fetchRequest]);

    const handleAcceptRequest = async (requestId) => {
        try {
            setError(null);
            const access_token = localStorage.getItem("access_token");
            const response = await fetch(backendUrl + '/request-feed', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request_id: requestId })
            });
            
            if (!response.ok) {
                throw new Error('Ошибка при принятии заявки');
            }
            
            const data = await response.json();
            if (data.success) {
                navigate('/home/volunteer');
            } else {
                setError('Не удалось принять заявку');
            }
        } catch (err) {
            setError('Ошибка при принятии заявки: '+ err.message);
        }
    };

    const serviceType = {
        "cleaning": "Уборка",
        "rubbish": "Вынос мусора",
        "delivery_food": "Доставка продуктов",
        "delivery_drugs": "Доставка лекарств",
        "consultation": "Общение",
        "mobility_help": "Помощь в передвижении",
        "other": "Другая услуга"
    }

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredAndSortedRequests = useMemo(() => {
        let filtered = requests;

        // Фильтрация по выбранным типам
        if (filterTypes.length > 0) {
            filtered = filtered.filter(req => filterTypes.includes(req.service_type));
        }
        // Если ничего не выбрано - показываем все заявки

        // Сортировка по дате
        filtered = [...filtered].sort((a, b) => {
            const dateA = new Date(a.desired_time);
            const dateB = new Date(b.desired_time);
            if (sortOrder === "newest") {
                return dateB - dateA; 
            } else {
                return dateA - dateB; 
            }
        });

        return filtered;
    }, [requests, filterTypes, sortOrder]);

    if (loading) {
        return (
            <div style={{
                backgroundImage: "none",
                backgroundColor: "white",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                margin: 0,
                padding: 0,
                minHeight: "100vh",
                overflow: "hidden",
            }}>
                <div className="loading_state">
                    <p>Загрузка заявок...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                backgroundImage: "none",
                backgroundColor: "white",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                margin: 0,
                padding: 0,
                minHeight: "100vh",
                overflow: "hidden",
            }}>
                <div className="error-state">
                    <p className="error-message">Ошибка: {error}</p>
                    <button 
                        onClick={fetchRequest}
                        className="retry-button"
                    >
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundImage: "none",
            backgroundColor: "white",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            margin: 0,
            padding: 0,
            minHeight: "100vh",
            overflow: "hidden",
            }}>
            <>
            <div className="header_div">
                <p className="header-p">
                    Лента заявок
                </p>
            </div>

            {requests.length > 0 && (
                <div className="filters-container">
                    <div className="filter-group">
                        <label className="filter-label">Тип услуги:</label>
                        <div className="checkbox-group">
                            {Object.entries(serviceType).map(([key, label]) => (
                                <label key={key} className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={filterTypes.includes(key)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFilterTypes([...filterTypes, key]);
                                            } else {
                                                setFilterTypes(filterTypes.filter(t => t !== key));
                                            }
                                        }}
                                        className="checkbox-input"
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Сортировка:</label>
                        <select 
                            className="filter-select"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="newest">Позднее</option>
                            <option value="oldest">Быстрее</option>
                        </select>
                    </div>
                </div>
            )}

            {requests.length === 0 ? (
                <div className="empty_state">
                    <p>Заявок пока нет</p>
                </div>
                ) : filteredAndSortedRequests.length === 0 ? (
                    <div className="empty_state">
                        <p>Нет заявок по выбранному фильтру</p>
                    </div>
                ) : (
                    <div className="request-list">
                        {filteredAndSortedRequests.map((app) => (
                            <div key={app.id} className="container-out">

                                    <div className="couple">
                                        <p className="p1">Имя заказчика</p>
                                        <p className="p2">{app.full_name}</p>
                                    </div>
                                    <div className="couple">
                                        <p className="p1">Тип услуги</p>
                                        <p className="p2">{serviceType[app.service_type]}</p>
                                    </div>
                                    <div className="couple">
                                        <p className="p1">Желаемое время выполнения</p>
                                        <p className="p2">{formatDateTime(app.desired_time)}</p>
                                    </div>

                                    {(app.service_type==="delivery_food" || app.service_type==="delivery_drugs") ?
                                    (
                                    <>
                                        <div className="couple">
                                        <p className="p1">Адрес</p>
                                        <p className="p2">{app.address}</p>
                                        </div>
                                        <div className="couple">
                                        <p className="p1">Список товаров</p>
                                        <p className="p2">{app.list_products}</p>
                                        </div>
                                    </>):((app.service_type==="mobility_help") ?
                                        (
                                        <>
                                            <div className="couple">
                                            <p className="p1">Откуда</p>
                                            <p className="p2">{app.address}</p>
                                            </div>
                                            <div className="couple">
                                            <p className="p1">Куда</p>
                                            <p className="p2">{app.destination_address}</p>
                                            </div>
                                        </>
                                        ):(
                                        <div className="couple">
                                        <p className="p1">Адрес</p>
                                        <p className="p2">{app.address}</p>
                                        </div>
                                        )
                                    )}
                                    <div className="couple">
                                        <p className="p1">Комментарий</p>
                                        <p className="p2">{app.comment || "Комментарий отсутствует"}</p>
                                    </div>
                                    <button 
                                        className="button_request"
                                        onClick={() => handleAcceptRequest(app.id)}
                                    >
                                        Принять заявку
                                    </button>
                            </div>
                            
                        ))}
                    </div>
                )
            }
            <button
                className="back-button"
                onClick={() => navigate(-1)}
                title="Вернуться назад"
            >
                ← Назад
            </button>
            </>
        </div>
    );
}

export default RequestFeed;