import { React, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
    const [username, setUsername] = useState('');
    const [about, setAbout] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const backendUrl = "http://localhost:8001";
    const access_token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    const getProfileData = async () => {
        setLoading(true);
        const request = await fetch(backendUrl + `/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
        });
        const data = await request.json();
        setProfileData(data);
        setUsername(data.full_name);
        setAbout(data.about || '');
        setLoading(false);
    };

    useEffect(() => {
        getProfileData();
    }, []);

    const renderAbout = () => {
        if (profileData && profileData.role === 'volunteer') {
            if (isEditing) {
                return (
                    <div className="profile-section">
                        <p className="profile-label">О себе</p>
                        <textarea
                            className="profile-textarea"
                            value={about || ''}
                            onChange={(e) => setAbout(e.target.value)}
                            rows={8}
                            maxLength={400}
                        />
                        <p style={{ fontSize: '12px', marginTop: '4px', textAlign: 'center'}}> 
                                {about.length || 0}/400
                        </p>
                        <div className="profile-buttons">
                            <button
                                className="profile-btn primary"
                                onClick={async () => {
                                    setIsEditing(false);
                                    await fetch(backendUrl + '/profile/about', {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${access_token}`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ about: about.trim() })
                                    });
                                }}
                            >
                                Сохранить
                            </button>
                            <button
                                className="profile-btn secondary"
                                onClick={() => {
                                    setIsEditing(false);
                                    setAbout(profileData.about || '');
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="profile-section">
                        <p className="profile-label">О себе</p>
                        <p className="profile-text">
                            {about || "Информация отсутствует"}
                        </p>
                        <button
                            className="profile-btn primary"
                            onClick={() => setIsEditing(true)}
                        >
                            Редактировать
                        </button>
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="profile-page">
            <div className="profile-header">
                <p className="profile-title">Профиль</p>
                <Link to={`/home/${role}`} className="profile-back">
                    На главную
                </Link>
            </div>

            <div className="profile-content">
                <div className="profile-card">
                    <p className="profile-name">{username}</p>
                    {profileData && (
                        <p className="profile-role">
                            Роль: {profileData.role === "volunteer" ? "Волонтёр" : "Пользователь"}
                        </p>
                    )}

                    {loading ? (
                        <p className="profile-loading">Загрузка...</p>
                    ) : (
                        renderAbout()
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;