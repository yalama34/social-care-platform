import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function RefreshHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const backendUrl = "http://localhost:8000";

    const refresh = async () => {
      const access_token = localStorage.getItem("access_token");
      if (!access_token) {
        navigate("/auth");
        return;
      }

      try {
        const response = await fetch(backendUrl + "/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ access_token }),
        });

        const data = await response.json();

        if (data.session_active) {
          navigate("/home");
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