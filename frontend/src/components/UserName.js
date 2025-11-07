import React,{useState} from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/auth_page.css'

function UserName() {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const backendUrl = "http://localhost:8000";
    const handleUsername = async () => {
        if (!username.trim()){
            alert("Введите Имя");
        return;
        }
        const temp_token = localStorage.getItem('temp_token');
            const request=await fetch(backendUrl + "/auth/end-register",{
                method:'POST',
                headers:{
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: username.trim(),
                    temp_token: temp_token
                })
            })
            const data=await request.json();
            localStorage.removeItem('phone');
            localStorage.removeItem('temp_token');
            localStorage.setItem('access_token', data.access_token);
            navigate('/home');
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
                        <button className="button_code" onClick={handleUsername}>
                            Продолжить
                        </button>
                    </div>

                </div>

            </>


        </div>



    )

}
export default UserName;