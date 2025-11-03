import React from "react";
import { Link } from 'react-router-dom';
import '../styles/auth_page.css'

function VerifyCode() {
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
                    <p className="login_p">Ввод кода</p>
                    <p className="phone_p">SMS-код</p>
                    <div className="container_phone">
                        <input type="text" className="input_phone" placeholder="Введите код из SMS"></input>
                        <button className="button_code" onClick={() => window.location.href = '/auth/end-register'}>Продолжить</button>
                    </div>

                </div>
            
        
            </>


        </div>



    )

}
export default VerifyCode;