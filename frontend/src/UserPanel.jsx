import React, { useEffect, useState } from "react";
import AppButton from "./AppButton";

export default function UserPanel({ token, onLogout, onGetUserData }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadUser() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("http://localhost:8000/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!data.ok) {
          setError("Failed to load user");
          return;
        }

        // backend:
        // class UserResponse(BaseModel):
        //   username: str
        //   user_uid: str

        setUserData(data.user);
        onGetUserData(data.user);
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  return (
    <header className="user-panel">
      <h1>AI-TV</h1>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {loading && <span style={{ opacity: 0.6 }}>Loading...</span>}
        {error && <span style={{ color: "tomato" }}>{error}</span>}
        {!loading && !error && <span>{userData?.username}</span>}

        <AppButton onClick={onLogout}>
          Logout
        </AppButton>
      </div>
    </header>
  );
}