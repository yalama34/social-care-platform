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
        if (data.id != data.access_id){
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
                // Если рейтинг не найден или ошибка, показываем 0
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
        if (profileData && profileData.role === 'volunteer' && ableEditing) {
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
                )
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
    }

    const renderStars = (ratingValue) => {
        if (!ratingValue || ratingValue === 0) {
            return (
                <div className="rating-stars-display">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="star-empty">★</span>
                    ))}
                </div>
            );
        }

        const normalizedRating = Math.min(5, Math.max(0, ratingValue));

        return (
            <div className="rating-stars-display">
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= Math.round(normalizedRating);
                    return (
                        <span
                            key={star}
                            className={isFilled ? "star-full" : "star-empty"}
                        >
                            ★
                        </span>
                    );
                })}
            </div>
        );
    };
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

                {ratingLoading ? (
                    <p>Загрузка рейтинга...</p>
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

            <button
                className="back-button"
                onClick={() => navigate(-1)}
                title="Вернуться назад"
            >
                ← Назад
            </button>
        </div>
    );
}

export default Profile;