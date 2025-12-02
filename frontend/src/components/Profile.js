import {React, useState, useEffect} from "react";
import {Link, useParams} from 'react-router-dom';

function Profile() {
    const { user_id } = useParams();
    const [username, setUsername] = useState('');
    const [about, setAbout] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const backendUrl = "http://localhost:8001";
    const access_token = localStorage.getItem("access_token");

    const getProfileData = async () => {
        setLoading(true);
        const request = await fetch(backendUrl + `/profile/${user_id}`, {
            method: 'GET',
        })
        const data = await request.json();
        setProfileData(data);
        setUsername(data.full_name);
        setAbout(data.about || '');
        setLoading(false);

    }
    useEffect(() => {
        getProfileData();
    }, [user_id]);
    const renderAbout = () => {
        if (profileData && profileData.role === 'volunteer') {
            if (isEditing) {
                return (
                    <div>
                        <p>О себе:</p>
                        <input value={about || ''}
                        onChange={(e) => setAbout(e.target.value)}></input>
                        <button onClick={async () => {
                            setIsEditing(false)
                            const request = await fetch(backendUrl + '/profile/about', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${access_token}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({about: about.trim()})
                            });   

                        }}>Подтвердить</button>
                        <button onClick={() => {
                            setIsEditing(false);
                            setAbout(profileData.about || 'Информация отсутствует');
                        }}>Отмена</button>
                    </div>
                )
            } else{
                return (
                    <div>
                        <p>О себе:</p>
                        <p>{about || 'Информация отсутствует'}</p>
                        <button onClick={() => setIsEditing(true)}>Редактировать</button>
                    </div>
                )
            }
        }
        return null;
    }
    return (
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
            <p>Профиль</p>
            <p>{username}</p>
            {loading ? <p>Загрузка...</p> : renderAbout()}




        </div>

    );
    
}
export default Profile;