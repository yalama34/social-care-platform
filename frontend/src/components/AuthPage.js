import React from "react";
import { Link } from 'react-router-dom';
import '../styles/auth_page.css'

function AuthApp(){
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
                    <p className="login_p">Вход</p>
                    <p className="phone_p">Номер телефона</p>
                    <input type="text" className="input_phone" placeholder="Ваш номер телефона"></input>
                    <button className="send_code_b">Отправить код</button>
                </div> 
            </>
        </div>
    );
}
export default AuthApp;