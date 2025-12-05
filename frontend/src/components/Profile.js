import {React, useState, useEffect} from "react";
import {Link, useParams, useNavigate} from 'react-router-dom';
import '../styles/profile.css';

function Profile() {
    const { user_id } = useParams();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [about, setAbout] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [ableEditing, setAbleEditing] = useState(true);
    const [rating, setRating] = useState(null);
    const [ratingLoading, setRatingLoading] = useState(false);
    const backendUrl = "http://localhost:8001";
    const access_token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    
    const getProfileData = async () => {
        setLoading(true);
        const request = await fetch(backendUrl + `/profile/${user_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access_token}`
            },
        })
        const data = await request.json();
        setProfileData(data);
        setUsername(data.full_name);
        setAbout(data.about || '');
        setLoading(false);
        if (data.id !== data.access_id){
            setAbleEditing(false);
        }

    }

    const getRating = async () => {
        if (!user_id || !access_token) return;

        setRatingLoading(true);
        try {
            const response = await fetch(`${backendUrl}/rating/${user_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRating(data);
            } else {
                setRating({ rating: 0, rating_count: 0 });
            }
        } catch (err) {
            console.error('Error fetching rating:', err);
            setRating({ rating: 0, rating_count: 0 });
        } finally {
            setRatingLoading(false);
        }
    };

    useEffect(() => {
        getProfileData();
        getRating();
    }, [user_id]);

    const renderAbout = () => {
        if (profileData && profileData.role === 'volunteer') {
            if (isEditing && ableEditing) {
                return (
                    <div className="profile-section">
                        <p className="profile-label">О себе</p>
                        <textarea
                            className="profile-textarea"
                            value={about || ''}
                            onChange={(e) => setAbout(e.target.value)}
                            placeholder="Расскажите о себе..."
                            rows={8}
                            maxLength={400}
                        />
                        <p style={{ fontSize: '13px', marginTop: '8px', textAlign: 'right', color: '#999'}}>
                            {about.length || 0}/400
                        </p>
                        <div className="profile-buttons">
                            <button className="profile-btn primary"
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
            } 
            else{
                return (
                    <div className="profile-section">
                        <p className="profile-label">О себе</p>
                        <p className="profile-text">
                            {about || "Информация отсутствует"}
                        </p>
                        <div className="profile-buttons">
                            {ableEditing && <button
                                className="profile-btn primary"
                                onClick={() => setIsEditing(true)}
                            >
                                Редактировать
                            </button>}
                        </div>
                    </div>
                );
            }
        } 
        return null;
    };

    const renderStars = (ratingValue) => {
        const fullStars = Math.floor(ratingValue || 0);
        const hasHalfStar = (ratingValue || 0) % 1 >= 0.5;
        
        return (
            <div className="rating-stars-display">
                {[1, 2, 3, 4, 5].map((star) => {
                    if (star <= fullStars) {
                        return <span key={star} className="star-full">★</span>;
                    } else if (star === fullStars + 1 && hasHalfStar) {
                        return <span key={star} className="star-half">★</span>;
                    } else {
                        return <span key={star} className="star-empty">★</span>;
                    }
                })}
            </div>
        );
    };

        return (
            <div className="profile-page">
                <div className="profile-header">
                    <p className="profile-title">Профиль</p>
                </div>

                <div className="profile-content">
                    {loading ? (
                        <p className="profile-loading">Загрузка...</p>
                    ) : (
                        <>
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <p className="profile-name">{username || "Загрузка..."}</p>
                                    {profileData && (
                                        <p className="profile-role">
                                            {profileData.role === "volunteer" ? "Волонтёр" : "Пользователь"}
                                        </p>
                                    )}
                                </div>

                                {ratingLoading ? (
                                    <div className="rating-display">
                                        <p className="rating-loading-text">Загрузка рейтинга...</p>
                                    </div>
                                ) : (
                                    <div className="rating-display">
                                        {renderStars(rating?.rating || 0)}
                                        <div className="rating-details">
                                            <span className="rating-value">{rating?.rating ? rating.rating.toFixed(1) : '0.0'}</span>
                                            <span className="rating-count">
                                                {rating?.rating_count > 0 ? (
                                                    `(${rating.rating_count} ${rating.rating_count === 1 ? 'оценка' : rating.rating_count < 5 ? 'оценки' : 'оценок'})`
                                                ) : (
                                                    '(пока нет оценок)'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {renderAbout()}
                        </>
                    )}
                </div>
                
                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                    title="Вернуться назад">
                    ← Назад
                </button>
            </div>
        );

}
export default Profile;