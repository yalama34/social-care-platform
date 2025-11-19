import React, {useState} from "react";
import { Link, replace, useNavigate} from 'react-router-dom';
import '../styles/auth_page.css'

function AuthApp(){
    let cur_adress = window.location.pathname;
    let login_p = "";
    let link_to = "";
    let link_text = "";
    const backendUrl = "http://localhost:8000";
    let [phone, setPhone] = useState("");
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
        if (!phone.trim()) {
            alert("Введите номер телефона");
            return;
        }
        const request = await fetch(backendUrl + cur_adress,{
            method: 'POST',
            headers:{
                'Content-type': 'application/json'
            },
            body: JSON.stringify({phone: phone.trim()})
        })
        const data = await request.json();

        if (data.code_sent){
            localStorage.setItem("phone", phone.trim())
            navigate("/auth/verify-phone");
        }
        else{
            alert('Ошибка');
        }
    }

    

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