import {React, useEffect} from "react";
import { Link, useNavigate } from "react-router-dom"; 
import "../styles/main_page.css";

function MainPage(){
    const navigate = useNavigate();
    const roleUser = async () =>{
        localStorage.setItem("role", "user");
        navigate("/auth/start-register");

    }
    const roleVolounteer = async () =>{
        localStorage.setItem("role", "volunteer");
        navigate("/auth/start-register");

    }

    return(
        <div style={{
            backgroundImage: 'url(${backgroundImage})',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            margin: 0,
            padding: 0,
            minHeight: "100vh",
        }}>
            <>
                <div className="content">
                    <p className="text_1">Сервис для нуждающихся в помощи людей</p>
                    <p className="text_2">
                        Здесь вы можете попросить доставить еду, лекарства, вынести мусор и просто
                        поговорить
                    </p>
                    <div className="container_button">
                        <button className="button_1" onClick={roleUser}>
                            Я нуждаюсь в помощи
                        </button>
                        <button className="button_2" onClick={roleVolounteer}>
                            Я хочу помочь
                        </button>
                    </div>
                </div> 
            <footer>
                <Link to="/support" className="text_3">
                    Поддержка
                </Link>
            </footer>
            </>
        </div>
    );   
}
export default MainPage;