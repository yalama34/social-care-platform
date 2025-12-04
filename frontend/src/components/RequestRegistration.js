import React,{useState} from "react";
import {useNavigate} from "react-router-dom";
import '../styles/request_registration.css';

function RequestRegistration() {
    const username = localStorage.getItem("full_name") || '';
    const [formData, setFormData] = useState({
        fullName: username,
        serviceType: '',
        address: '',
        destinationAddress:'',
        listProducts: '',
        comment: '',
        desiredTime: ''
    });
    let address_text="Адрес проживания";
    let additional_field = "Куда доставить";
    if (formData.serviceType==="mobility_help")
        address_text="Откуда доставить";
    if (formData.serviceType === "delivery_food")
        additional_field = "Список продуктов";
    if (formData.serviceType === "delivery_drugs")
        additional_field = "Список лекарств";

    const backendUrl = "http://localhost:8001";

    const backendUrl = "http://localhost:8001";
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const access_token = localStorage.getItem("access_token");
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = async () => {
        if (!formData.fullName.trim() || !formData.serviceType || !formData.address.trim() || !formData.desiredTime) {
            //сделать выплывающее информирующее окно
            alert("Заполните обязательные поля: ФИО, тип услуги, адрес и время");
            return;
        }
        if (((formData.serviceType === "delivery_food" || formData.serviceType === "delivery_drugs") && !formData.listProducts.trim()) || (formData.serviceType === "mobility_help" && !formData.destinationAddress.trim())){
            //сделать выплывающее информирующее окно
            alert(`Заполните ${additional_field}`);
            return;
        }

        const requestBody = {
            full_name: formData.fullName.trim(),
            service_type: formData.serviceType,
            address: formData.address.trim(),
            comment: formData.comment.trim(),
            desired_time: formData.desiredTime
        };
        if (formData.serviceType === 'mobility_help') {
            requestBody.destination_address = formData.destinationAddress.trim();
        }
        if (formData.serviceType === "delivery_food" || formData.serviceType === "delivery_drugs"){
            requestBody.list_products = formData.listProducts.trim();
        }
        const response = await fetch(backendUrl + '/request/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
        const response = await fetch(backendUrl + '/request/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`,
                },
                body: JSON.stringify({
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
                                maxLength={30}
                            />
                            <p className="input_p">{address_text}</p>
                            <input
                                type="text"
                                className="input_field"
                                placeholder="Введите адрес"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                            />
                            {
                                (formData.serviceType === "mobility_help" || formData.serviceType ==="delivery_drugs" || formData.serviceType === "delivery_food")?(
                                <>
                                <p className="input_p">{additional_field}</p>
                                <input
                                    type="text"
                                    className="input_field"
                                    placeholder={`Введите ${additional_field}`}
                                    name={formData.serviceType === "mobility_help" ? "destinationAddress" : "listProducts"}
                                    value={formData.serviceType === "mobility_help"?(formData.destinationAddress):(formData.listProducts)}
                                    onChange={handleInputChange}
                                />
                                </>):null
                            }
                        </div>
                        <div className="container_in">
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

                            <p className="input_p">Желаемое время выполнения</p>
                        <input
                            type="datetime-local"
                            className="datetime-input-custom"
                            name="desiredTime"
                            value={formData.desiredTime}
                            onChange={handleInputChange}
                        />
                        </div>
                    </div>

                    <p className="input_p">Комментарий</p>
                            <textarea
                                className="input_comm"
                                placeholder="Введите комментарий"
                                name="comment"
                                value={formData.comment}
                                onChange={handleInputChange}
                                maxLength={300}
                                rows={4}
                            />
                            <p style={{ fontSize: '12px', marginTop: '4px', textAlign: 'center'}}>
                                {formData.comment.length || 0}/300
                            </p>

                    <button className="button" onClick={handleSubmit}>
                        Отправить
                    </button>
                    <button
                        className="back-button"
                        onClick={() => navigate(-1)}
                        title="Вернуться назад"
                    >
                        ← Назад
                    </button>
                </>
        </div>
    )
}
export default RequestRegistration;