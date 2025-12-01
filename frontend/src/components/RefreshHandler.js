import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function RefreshHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const backendUrl = "http://localhost:8000";
    const role = localStorage.getItem("role");

    const refresh = async () => {
      const access_token = localStorage.getItem("access_token");
      alert(access_token);
      if (!access_token) {
        navigate("/auth");
        return;
      }

      try {
        const response = await fetch(backendUrl + `/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`,
          },
        });

        const data = await response.json();

        if (data.session_active) {
          if (data.access_token) {
              localStorage.setItem("access_token", data.access_token);
              localStorage.setItem("role", data.role);
              localStorage.setItem("full_name", data.full_name);
            }
          navigate(`/home/${role}`);
        } else {
          navigate("/auth");
        }
      } catch (err) {
        console.error("Ошибка при обновлении токена", err);
        navigate("/auth");
      }
    };

    refresh();
  }, [navigate]);

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
    <h1>Обновляем сессию...</h1>
  </div>
);
}

export default RefreshHandler;