import React, { useEffect, useState } from "react";
import ChannelList from "./ChannelList";
import AppButton from "./AppButton";
import ChannelTabs from "./ChannelTabs";
import UserPanel from "./UserPanel";
import Stage from "./Stage";
import "./global.css";

export default function App() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerInviteCode, setRegisterInviteCode] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSubscription, setInviteSubscription] = useState("free");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState(null);
  const [userData, setUserData] = useState(null);

  const [reloadChannelsTrigger, setReloadChannelsTrigger] = useState(0);
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  async function doLogin() {
    setAuthLoading(true);
    setAuthError("");
    setAuthInfo("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
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

  async function doRegister() {
    setRegisterLoading(true);
    setRegisterError("");
    setAuthInfo("");

    const normalizedEmail = registerEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setRegisterError("Email is required");
      setRegisterLoading(false);
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setRegisterError("Enter a valid email");
      setRegisterLoading(false);
      return;
    }

    if (!registerInviteCode.trim()) {
      setRegisterError("Open the registration form from your invite link");
      setRegisterLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: registerPassword,
          invite_code: registerInviteCode.trim(),
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setRegisterError(data.error || "Registration failed");
        return;
      }

      setUsername(normalizedEmail);
      setPassword("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterOpen(false);
      setAuthInfo("Registration successful. Please login.");
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      setRegisterError("Network error");
    } finally {
      setRegisterLoading(false);
    }
  }
  
  useEffect(() => {
    if (!authToken) {
      setLoginOpen(true);
    }
  }, [authToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCodeFromLink = params.get("invite_code");
    const inviteEmailFromLink = params.get("email");

    if (!inviteCodeFromLink) {
      return;
    }

    setRegisterInviteCode(inviteCodeFromLink);
    setRegisterOpen(true);
    setLoginOpen(true);
    setAuthInfo("");
    setRegisterError("");

    if (inviteEmailFromLink) {
      setRegisterEmail(inviteEmailFromLink.toLowerCase());
    }
  }, []);
  
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
  
  async function onAddUser() {
    if (authToken) {
      setAddUserOpen(true);
      setInviteError("");
      setInviteLink("");
    }
  };
  
  async function doAddUser() {
    setInviteLoading(true);
    setInviteError("");
    setInviteCode("");
    setInviteLink("");

    const normalizedInviteEmail = inviteEmail.trim().toLowerCase();

    if (!normalizedInviteEmail) {
      setInviteError("Email is required");
      setInviteLoading(false);
      return;
    }

    if (!normalizedInviteEmail.includes("@")) {
      setInviteError("Enter a valid email");
      setInviteLoading(false);
      return;
    }

    if (!inviteSubscription.trim()) {
      setInviteError("Subscription is required");
      setInviteLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/create_invite`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${authToken}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ email: normalizedInviteEmail, subscription: inviteSubscription.trim() }),
      });

      const data = await res.json();
      if (!data.ok) {
        setInviteError(data.error || "Failed to create invite");
        return;
      }
      setInviteCode(data.invite.code);
      const inviteParams = new URLSearchParams({
        invite_code: data.invite.code,
        email: data.invite.email,
      });
      setInviteLink(`${window.location.origin}${window.location.pathname}?${inviteParams.toString()}`);

    } catch {
      setInviteError("Network error");
    } finally {
      setInviteLoading(false);
    }
  };

  if (loginOpen) {
    if (registerOpen) {
      return (
        <div className="center-screen">
          <div className="login-card">
            <h2>AI-TV Registration</h2>

            <input
              type="email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              placeholder="Email"
            />

            <input
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="Password"
            />

            {registerError && <div className="error">{registerError}</div>}
            {!!registerInviteCode && <div style={{ opacity: 0.7 }}>Invite applied for {registerEmail || "this registration"}</div>}

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <AppButton onClick={doRegister} disabled={registerLoading}>
                {registerLoading ? "Registering..." : "Register"}
              </AppButton>

              <AppButton
                onClick={() => {
                  setRegisterOpen(false);
                  setRegisterError("");
                }}
              >
                Back to login
              </AppButton>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="center-screen">
        <div className="login-card">
          <h2>AI-TV Login</h2>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Email or username"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          {authError && <div className="error">{authError}</div>}
          {authInfo && <div style={{ color: "lightgreen" }}>{authInfo}</div>}

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <AppButton onClick={doLogin} disabled={authLoading}>
              {authLoading ? "Logging in..." : "Login"}
            </AppButton>

            <AppButton
              onClick={() => {
                setRegisterOpen(true);
                setRegisterError("");
                setAuthInfo("");
              }}
            >
              Register
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  if (addUserOpen) {
    return (
        <div className="center-screen">
          <div className="login-card">
          <h2>Create Invite</h2>

          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            value={inviteSubscription}
            onChange={(e) => setInviteSubscription(e.target.value)}
            placeholder="Subscription"
          />

          {inviteError && <div className="error">{inviteError}</div>}
          {inviteCode && <div style={{ color: "lightgreen", wordBreak: "break-all" }}>Invite code: {inviteCode}</div>}
          {inviteLink && <div style={{ color: "lightgreen", wordBreak: "break-all" }}>Invite link: {inviteLink}</div>}

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <AppButton onClick={doAddUser} disabled={inviteLoading}>
              {inviteLoading ? "Creating..." : "Create invite"}
            </AppButton>

            <AppButton
              onClick={() => {
                setAddUserOpen(false);
                setInviteCode("");
                setInviteLink("");
                setInviteError("");
              }}
            >
              Close
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout">
      {/* Верхняя панель */}
      {!isFullscreen && (
        <UserPanel token={authToken} onLogout={doLogout} onGetUserData={setUserData} onAddUser={onAddUser}/>
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
            <ChannelList token={authToken} userData={userData} onSelectChannel={handleSelectChannel} reloadChannelsTrigger={reloadChannelsTrigger} />
            </div>
        )}

        {/* Контент канала (ChannelDescription + Playlist) */}
        <div
          style={{
            flex: 1,                 // занимает оставшиеся 75%
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            // padding: "20px",
            overflow: "hidden",
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
