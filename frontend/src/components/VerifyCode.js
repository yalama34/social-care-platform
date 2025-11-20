import React,{useState} from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/auth_page.css'

function VerifyCode() {
    const [code, setCode] = useState('');
    const navigate = useNavigate();
    const backendUrl = "http://localhost:8000";
    const role = localStorage.getItem("role");
    const handleValidateCode = async () => {
        if (!code.trim()){
            alert("Введите код");
        return;
    }
        const phone = localStorage.getItem('phone');
        const request=await fetch(backendUrl + "/auth/verify-phone",{
            method:'POST',
            headers:{
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                code: code.trim(),
                phone: phone
            })
        })
        const data=await request.json();
        if (data.verified){
            localStorage.setItem('temp_token', data.temp_token)
            if (data.purpose === 'register'){
                navigate("/auth/end-register");
            }
            else if (data.purpose === 'login'){
                await handleLogin(data.temp_token);
            }
        }
        else{
            alert('Ошибка');
        }
    }
    const handleLogin = async (temp_token) => {
        const request = await fetch(backendUrl + "/auth/login-end", {
            method:'POST',
            headers:{
                'Content-type': 'application/json'
            },
            body: JSON.stringify({temp_token})
        })
        const data = await request.json()
        localStorage.setItem("access_token", data.access_token)
        localStorage.removeItem('phone');
        localStorage.removeItem('temp_token');
        navigate(`/home/${role}`);
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
                    <p className="login_p">Ввод кода</p>
                    <p className="phone_p">SMS-код</p>
                    <div className="container_phone">
                        <input type="text"
                         className="input_phone"
                          placeholder="Введите код из SMS"
                          onChange={(e) => setCode(e.target.value)}
                          value={code}>
                        </input>
                        <button className="button_code" onClick={handleValidateCode}>
                            Продолжить
                        </button>
                    </div>

                </div>
            
        
            </>


        </div>
    )

}
export default VerifyCode;