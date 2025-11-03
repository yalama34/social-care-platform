import React from "react";
import {Link} from "react-router-dom";
import '../styles/request_registration.css';

function RequestRegistration() {
    return(
        <div style={{
            backgroundImage: "none",
                    backgroundColor: "#FFE851",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    margin: 0,
                    padding: 0,
                    minHeight: "100vh",
                    overflow: "hidden",
            }}>
                <>
                    <p className="header_p">Регистрация заявки</p>
                    <div className="container_out">
                        <div className="container_in">
                            <p className="input_p">Фамилия Имя</p>
                            <input type="text" className="input_field" placeholder="Введите Фамилия Имя"></input>
                            <p className="input_p">Тип услуги</p>
                            <div className="custom-select">
                                <select className="selest">
                                    <option value="">Выберите услугу</option>
                                    <option value="cleaning">Уборка</option>
                                    <option value="repair">Вынос мусора</option>
                                    <option value="delivery_food">Доставка продуктов</option>
                                    <option value="delivery_drugs">Доставка лекарств</option>
                                    <option value="consultation">Общение</option>
                                    <option value="consultation">Помощь в передвижении</option>
                                    <option value="other">Другая услуга</option>
                                </select>
                            </div>
                        </div>
                        <div className="container_in">
                            <p className="input_p">Адрес проживания</p>
                            <input type="text" className="input_field" placeholder="Введите адрес"></input>
                            <p className="input_p">Комментарий</p>
                            <input type="text" className="input_field" placeholder="Введите комментарий"></input>
                        </div>
                    </div>
                    <p className="input_p">Желаемое время выполнения</p>
                    <input type="datetime-local" className="datetime-input-custom"/>
                    <Link to="" className="button">
                        Отправить
                    </Link>
                </>
           
        </div>


    )


}
export default RequestRegistration;