import React,{useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/auth_page.css';
import Notification from "./Notification";

function UserName() {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const backendUrl = "http://localhost:8000";
    let [errorMessage, setErrorMessage] = useState("");
    const [notification, setNotification] = useState({ message: null, type: 'error' });

    const showNotification = (message, type = 'error') => {
        setNotification({ message, type });
    };

    const hideNotification = () => {
        setNotification({ message: null, type: 'error' });
    };

    const handleUsername = async () => {
        if (!username.trim()){
            showNotification("Введите Имя", 'warning');
        return;
        }
        const temp_token = localStorage.getItem('temp_token');
        const role = localStorage.getItem("role");
            const request=await fetch(backendUrl + `/auth/end-register`,{
                method:'POST',
                headers:{
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: username.trim(),
                    temp_token: temp_token,
                    role: role
                })
            })
            if (!request.ok){
                if (request.status === 422){
                    setErrorMessage("Неверный формат имени");
                    return;
                }
                const errorData = await request.json();
                setErrorMessage(errorData.detail || "Ошибка при установке имени");
                return;
            }
            const data=await request.json();
            localStorage.removeItem('phone');
            localStorage.removeItem('temp_token');
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('full_name', username.trim());
            showNotification("Регистрация успешно завершена!", 'success');
            setTimeout(() => {
                navigate(`/home/${role}`);
            }, 1000);
        }
    useEffect(() => {
        setErrorMessage("");
    }, [username]);
    return(
        <div style={{
                    backgroundImage: "none",
                    backgroundColor: "white",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    margin: 0,
                    padding: 0,
                    minHeight: "100vh"
                }}>
            <>
                <div className="auth_block">
                    <p className="login_p">Вход</p>
                    <p className="phone_p">Фамилия Имя</p>
                        <div className="container_phone">
                        <input type="text"
                         className="input_phone"
                          placeholder="Введите Фамилия Имя"
                          onChange={(e) => setUsername(e.target.value)}
                          value={username}>
                        </input>
                        <p className="error_message">{errorMessage || ""}</p>
                        <button className="button_code" onClick={handleUsername}>
                            Продолжить
                        </button>
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



    )

}
export default UserName;