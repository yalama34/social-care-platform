import {React, useState, useEffect, use} from "react";
import {Link} from 'react-router-dom';

function Profile() {
    const [username, setUsername] = useState('');
    const [about, setAbout] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);

    const getProfileData = async () => {
        setLoading(true);
        const backendUrl = "http://localhost:8001";
        const request = await fetch(backendUrl + `/profile?authorization=Bearer ${localStorage.getItem("access_token")}`, {
            method: 'GET'
        })
        const data = await request.json();
        setProfileData(data);
        setUsername(data.full_name);
        setAbout(data.about || '');
        setLoading(false);

    }
    useEffect(() => {
        getProfileData();
    }, []);
    const renderAbout = () => {
        if (profileData && profileData.role === 'volunteer') {
            return (
                <div>
                    <p>О себе:</p>
                    <p>{profileData.about || 'Информация отсутствует'}</p>
                </div>
            )
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
                overflow: "hidden", 
        }}>
            <p>Профиль</p>
            <p>{username}</p>
            {loading ? <p>Загрузка...</p> : renderAbout()}




        </div>

    );
    
}
export default Profile;