import React,{useState} from "react";
import {useNavigate} from "react-router-dom";
import '../styles/request_registration.css';

function RequestRegistration() {
    const [formData, setFormData] = useState({
        fullName: '',
        serviceType: '',
        address: '',
        comment: '',
        desiredTime: ''
    });

    const backendUrl = "http://localhost:8001";
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = async () => {
        if (!formData.fullName.trim() || !formData.serviceType || !formData.address.trim() || !formData.desiredTime) {
            alert("Заполните обязательные поля: ФИО, тип услуги, адрес и время");
            return;
        }
        const response = await fetch(backendUrl + '/request/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: localStorage.getItem("access_token"),
                    full_name: formData.fullName.trim(),
                    service_type: formData.serviceType,
                    address: formData.address.trim(),
                    comment: formData.comment.trim(),
                    desired_time: formData.desiredTime

                })
            });
        const data = await response.json();
        if (data.success) {
                navigate(`/home/${role}`);
            } 
        else {
                alert('Не удалось создать заявку');
            }
    }
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
                            <input 
                                type="text" 
                                className="input_field" 
                                placeholder="Введите Фамилия Имя"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                            />
                            <p className="input_p">Тип услуги</p>
                            <div className="custom-select">
                                <select 
                                    className="selest"
                                    name="serviceType"
                                    value={formData.serviceType}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Выберите услугу</option>
                                    <option value="cleaning">Уборка</option>
                                    <option value="rubbish">Вынос мусора</option>
                                    <option value="delivery_food">Доставка продуктов</option>
                                    <option value="delivery_drugs">Доставка лекарств</option>
                                    <option value="consultation">Общение</option>
                                    <option value="mobility_help">Помощь в передвижении</option>
                                    <option value="other">Другая услуга (указать в коментарии)</option>
                                </select>
                            </div>
                        </div>
                        <div className="container_in">
                            <p className="input_p">Адрес проживания</p>
                            <input 
                                type="text" 
                                className="input_field" 
                                placeholder="Введите адрес"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                            />
                            <p className="input_p">Комментарий</p>
                            <input 
                                type="text" 
                                className="input_field" 
                                placeholder="Введите комментарий"
                                name="comment"
                                value={formData.comment}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    <p className="input_p">Желаемое время выполнения</p>
                    <input 
                        type="datetime-local" 
                        className="datetime-input-custom"
                        name="desiredTime"
                        value={formData.desiredTime}
                        onChange={handleInputChange}
                    />
                    <button className="button" onClick={handleSubmit}>
                        Отправить
                    </button>
                </>
        </div>
    )
}
export default RequestRegistration;