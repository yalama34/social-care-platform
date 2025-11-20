import {React, useEffect, useState} from "react";
import {Link} from 'react-router-dom';
import '../styles/home_page.css';

function HomePage() {
    const [activeRequests, setActiveRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getRequests = async () => {
        const backendUrl = "http://localhost:8001";
        const role = localStorage.getItem("role");
        const access_token = localStorage.getItem("access_token");
        setLoading(true);
        try{
            const request = await fetch(backendUrl + `/home/${role}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                }
            });
            const data = await request.json();
            if (request.status === 200){
                setActiveRequests(Object.values(data.active_requests || {}));
                setHistoryRequests(Object.values(data.completed_requests || {}));
                setLoading(false);
            }
        }
        catch(err){
            setError(err.message);
            return;
        }
    }

    useEffect(() => {
        getRequests();   
    }, []);

    const serviceType = {
        "cleaning": "Уборка",
        "rubbish": "Вынос мусора",
        "delivery_food": "Доставка продуктов",
        "delivery_drugs": "Доставка лекарств",
        "consultation": "Общение",
        "mobility_help": "Помощь в передвижении",
        "other": "Другая услуга"
    }
    const serviceStatus = {
        "onwait": "Ожидает выполнения",
        "in_progress": "В процессе",
        "completed": "Завершено",
        "cancelled": "Отменено"
    }

    const renderRequests = (list) => {
        if (!list || list.length === 0) {
            return <div className="empty-state">Нет заявок</div>;
        }
        return list.map((request) => {
            const dt = request.desired_time ? new Date(request.desired_time) : null;
            const timeString = dt ? dt.toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : (request.desired_time || "Время не указано");
            return (
                <div key={request.id} className="request-card"> 
                    <p>{serviceStatus[request.status]}</p>
                    <p>{serviceType[request.service_type]}</p>
                    <p>Адрес: {request.address}</p>
                    <p>Комментарий {request.comment || "Нет комментария"}</p>
                    <p>Желаемое время: {timeString}</p>
                
                </div>
            );
        })
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
        }}>
            <div className="div-header">
                <p className="p-header" style={{ 
                    margin: 0, 
                    fontSize: "24px",
                    fontWeight: "800"
                }}>
                    Главная
                </p>
            </div>

            <div className="requests-div">
                <p className="p-bold">Активные заявки</p>
                {loading ? <p>Загрузка...</p> : error ? <p className="error-text">Ошибка: {error}</p> : renderRequests(activeRequests)}
                <p className="p-bold">История заявок</p>
                {loading ? <p>Загрузка...</p> : error ? <p className="error-text">Ошибка: {error}</p> : renderRequests(historyRequests)}
                <Link to={"/request"} className="request-button">Новая заявка</Link>
                <div>Связаться с нами</div>
            </div>
        </div>
    );
}

export default HomePage;