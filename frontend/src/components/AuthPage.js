import React from "react";
import { Link } from 'react-router-dom';
import '../styles/auth_page.css'

function AuthApp(){
    let cur_adress = window.location.pathname;
    let login_p = "";
    let link_to = "";
    let link_text = "";
    if (cur_adress === "/auth/login"){
        login_p = "Вход";
        link_to = "/auth/start-register";
        link_text = "Нет аккаунта? Зарегестрируйся";
    } else{
        login_p = "Регистрация";
        link_to = "/auth/login";
        link_text = "Есть аккаунт? Войти";
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
                        <input type="text" className="input_phone" placeholder="Введите номер телефона"></input>
                        <Link to="/auth/verify-phone" className="button_code">
                            Отправить код
                        </Link>
                    
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