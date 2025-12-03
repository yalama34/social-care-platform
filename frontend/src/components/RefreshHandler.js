import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function RefreshHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/auth")) {
      return;
    }

    const backendUrl = "http://localhost:8000";

    const refresh = async () => {
      const access_token = localStorage.getItem("access_token");
      
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

        if (response.status === 403) {
          localStorage.clear();
          navigate("/auth");
          return;
        }

        const data = await response.json();

        if (!response.ok || !data.session_active) {
          localStorage.clear();
          navigate("/auth");
          return;
        }

        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
        }

      } catch (err) {
        console.error("Ошибка при проверке сессии", err);
        localStorage.clear();
        navigate("/auth");
      }
    };

    refresh();
  }, [location.pathname, navigate]);

  return null;
}

export default RefreshHandler;