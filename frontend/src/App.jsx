import React, { useEffect, useState } from "react";
import ChannelList from "./ChannelList";
import AppButton from "./AppButton";
import ChannelTabs from "./ChannelTabs";
import UserPanel from "./UserPanel";
import Stage from "./Stage";
import "./global.css";

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState(null);
  const [userData, setUserData] = useState(null);

  const [reloadChannelsTrigger, setReloadChannelsTrigger] = useState(0);
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  async function doLogin() {
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.ok) {
        setAuthError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.access_token);
      setAuthToken(data.access_token);
      setLoginOpen(false);
    } catch {
      setAuthError("Network error");
    } finally {
      setAuthLoading(false);
    }
  }

  function doLogout() {
    localStorage.removeItem("token");
    setAuthToken("");
    setLoginOpen(true);
  }
  
  useEffect(() => {
    if (!authToken) {
      setLoginOpen(true);
    }
  }, [authToken]);

  if (loginOpen) {
    return (
      <div className="center-screen">
        <div className="login-card">
          <h2>AI-TV Login</h2>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          {authError && <div className="error">{authError}</div>}

          <AppButton onClick={doLogin} disabled={authLoading}>
            {authLoading ? "Logging in..." : "Login"}
          </AppButton>
        </div>
      </div>
    );
  }
  
  
  useEffect(() => {
    const onFsChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);
  

  function handleSelectChannel(newChannel) {       
    if (newChannel.channel_uid === selectedChannel?.channel_uid) return; // если кликнули по уже выбранному — ничего не делаем
    setSelectedChannel(newChannel);
  }

  function handleEditChannel(channel) {    
    console.log("Editing channel:", channel);
    setSelectedChannel(channel);
  }

  function handleDeleteChannel(channel_uid) {  

    // Удаляем канал из состояния
    // setChannels(prev => prev.filter(c => c.channel_uid !== channel_uid));

    // Если удаляли выбранный канал — сбрасываем selection
    console.log("Deleting channel:", channel_uid, "Selected channel:", selectedChannel?.channel_uid);
    if (selectedChannel?.channel_uid === channel_uid) {
        console.log("Deleted channel was selected, clearing selection");
        setSelectedChannel(null);
        localStorage.removeItem("current_channel");
    }
    setReloadChannelsTrigger(prev => prev + 1);
  }
  


  return (
    <div className="main-layout">
      {/* Верхняя панель */}
      {!isFullscreen && (
        <UserPanel token={authToken} onLogout={doLogout} onGetUserData={setUserData}/>
      )}

      {/* Основной контент: боковая панель + контент */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Боковая панель (список каналов) */}
        {!isFullscreen && (
            <div
            style={{
                flex: "0 0 25%",       // занимает 25% ширины, но не сжимается меньше содержимого
                minWidth: 200,        // минимальная ширина
                maxWidth: 600,        // максимальная ширина
                padding: "20px",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                flexDirection: "column",
            }}
            >
            <ChannelList token={authToken} onSelectChannel={handleSelectChannel} reloadChannelsTrigger={reloadChannelsTrigger} />
            </div>
        )}

        {/* Контент канала (ChannelDescription + Playlist) */}
        <div
          style={{
            flex: 1,                 // занимает оставшиеся 75%
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            // padding: "20px",
            overflowY: "auto",       // если плейлист длинный, появляется скролл
          }}
        >
          {selectedChannel && (
            <ChannelTabs token={authToken} userData={userData} channel={selectedChannel} onEditChannel={setSelectedChannel} onDeleteChannel={handleDeleteChannel} />
          )}
        </div>
      </div>
    </div>
  );
}