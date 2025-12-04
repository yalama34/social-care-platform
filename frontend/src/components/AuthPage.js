import React, {useState, useEffect} from "react";
import { Link, replace, useNavigate} from 'react-router-dom';
import '../styles/auth_page.css';
import Notification from "./Notification";

function AuthApp(){
    let cur_adress = window.location.pathname;
    let login_p = "";
    let link_to = "";
    let link_text = "";
    const backendUrl = "http://localhost:8000";
    let [phone, setPhone] = useState("");
    let [errorMessage, setErrorMessage] = useState("");
    const [notification, setNotification] = useState({ message: null, type: 'error' });
    const navigate = useNavigate();

    const showNotification = (message, type = 'error') => {
        setNotification({ message, type });
    };

    const hideNotification = () => {
        setNotification({ message: null, type: 'error' });
    };
    if (cur_adress == "/auth/login-start"){
        login_p = "Вход";
        link_to = "/auth/start-register";
        link_text = "Нет аккаунта? Зарегестрируйся";
    } else{
        login_p = "Регистрация";
        link_to = "/auth/login-start";
        link_text = "Есть аккаунт? Войти";
    }

    const handleSendCode = async () => {
        setErrorMessage("");
        if (!phone.trim()) {
            showNotification("Введите номер телефона", 'warning');
            return;
        }
        const request = await fetch(backendUrl + cur_adress,{
            method: 'POST',
            headers:{
                'Content-type': 'application/json'
            },
            body: JSON.stringify({phone: phone.trim()})
        })
        if (!request.ok){
            if (request.status === 422){
                setErrorMessage("Неверный формат номера телефона");
                return;
            }
            const errorData = await request.json();
            setErrorMessage(errorData.detail || "Ошибка запроса");
            return;
        }
        else{
            const data = await request.json();

            if (data.code_sent){
                localStorage.setItem("phone", phone.trim())
                navigate("/auth/verify-phone");
            }
            else{
                showNotification('Ошибка отправки кода', 'error');
            }
        }
    }
    useEffect(() => {
        setErrorMessage("");
    }, [phone]);

    

    return(
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
            <>
                <div className="auth_block">
                    <p className="login_p">{login_p}</p>
                    <p className="phone_p">Номер телефона</p>
                    <div className="container_phone">
                        <input type="text" 
                            className="input_phone" 
                            placeholder="Введите номер телефона" 
                            onChange={(e) => setPhone(e.target.value)} 
                            value={phone}>
                        </input>
                        <p className="error_message">{errorMessage || ""}</p>
                        <button className="button_code" onClick={handleSendCode}>
                            Отправить код
                        </button>
                    
                        <Link to={link_to} className="link_1">
                            {link_text}
                        </Link>
                    </div>
                </div>
            </>
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
export default AuthApp;