import React from "react";
import { Link } from "react-router-dom"; 
import "../styles/main_page.css";

function MainPage(){
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
                        <Link to="/auth/login" className="button_1">
                            Я нуждаюсь в помощи
                        </Link>
                        <Link to="/register/volunteer" className="button_2">
                            Я хочу помочь
                        </Link>
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