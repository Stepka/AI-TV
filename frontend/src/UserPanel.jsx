import React, { useEffect, useState } from "react";
import AppButton from "./AppButton";
import YoutubeLoginButton from "./YoutubeLoginButton";

export default function UserPanel({ token, onLogout, onGetUserData, onAddUser }) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadUser() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
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

        console.log(data.user)

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
        {/* {!loading && !error && <span>Tokens: {userData?.tokens}</span>} */}
        {!loading && !error && <span>Subscription: {userData?.subscription.name}</span>}

        <AppButton onClick={onLogout}>
          Logout
        </AppButton>

        {userData?.role =="admin" && (<AppButton onClick={onAddUser}>
          Add User
        </AppButton>
        )}

        {/* <YoutubeLoginButton/> */}
      </div>
    </header>
  );
}