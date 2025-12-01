import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/requestfeed.css';

function RequestFeed() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            <div className="header_div">
                <p className="header-p">
                    Лента заявок
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="empty_state">
                    <p>Заявок пока нет</p>
                </div>
            ) : (
                <div className="request-list">
                    {requests.map((app) => (
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
                                
                                {(serviceType[app.serviceType]==="delivery_food" || serviceType[app.serviceType]==="delivery_drugs") ?
                                (<>
                                    <div className="couple">
                                    <p className="p1">Адрес</p>
                                    <p className="p2">{app.address}</p>
                                </div>
                                    <div className="couple">
                                    <p className="p1">Список товаров</p>
                                    <p className="p2">{app.listProducts}</p>
                                    </div>
                                    </>):(serviceType[app.serviceType]==="mobility_help" ?
                                        (<>
                                    <div className="couple">
                                    <p className="p1">Откуда</p>
                                    <p className="p2">{app.address}</p>
                                </div>
                                    <div className="couple">
                                    <p className="p1">Куда</p>
                                    <p className="p2">{app.destinationAdress}</p>
                                    </div>
                                    </>):(
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
            )}
        </div>
    );
}

export default RequestFeed;