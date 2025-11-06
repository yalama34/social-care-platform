import React,{useState} from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/auth_page.css'

function UserName() {
    const [username, setUsername] = useState('');
        const navigate = useNavigate();
        const handleUsername = async () => {
            if (!username.trim()){
                alert("Введите Имя");
            return;
        }
            const request=await fetch("/auth/end-register",{
                method:'POST',
                headers:{
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({username: username.trim()})
            })
            const data=await request.json();
            if (data.code_sent){
                navigate("/request");
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