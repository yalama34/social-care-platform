import React, {useState, useEffect} from "react";
import { Link, replace, useNavigate} from 'react-router-dom';
import '../styles/auth_page.css'

function AuthApp(){
    let cur_adress = window.location.pathname;
    let login_p = "";
    let link_to = "";
    let link_text = "";
    const backendUrl = "http://localhost:8000";
    let [email, setEmail] = useState("");
    let [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
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
        if (!email.trim()) {
            alert("Введите email");
            return;
        }
        const request = await fetch(backendUrl + cur_adress,{
            method: 'POST',
            headers:{
                'Content-type': 'application/json'
            },
            body: JSON.stringify({email: email.trim()})
        })
        if (!request.ok){
            if (request.status === 422){
                setErrorMessage("Неверный формат email");
                return;
            }
            const errorData = await request.json();
            setErrorMessage(errorData.detail || "Ошибка запроса");
            return;
        }
        else{
            const data = await request.json();

            if (data.code_sent){
                localStorage.setItem("email", email.trim())
                navigate("/auth/verify-email");
            }
            else{
                alert('Ошибка');
            }
        }
    }
    useEffect(() => {
        setErrorMessage("");
    }, [email]);

    

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
                    <p className="phone_p">Email</p>
                    <div className="container_phone">
                        <input type="email" 
                            className="input_phone" 
                            placeholder="Введите email" 
                            onChange={(e) => setEmail(e.target.value)} 
                            value={email}>
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
        </div>
    );
}
export default AuthApp;