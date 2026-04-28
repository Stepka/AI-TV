import React, { useEffect, useState } from "react";
import ChannelList from "./ChannelList";
import AppButton from "./AppButton";
import ChannelTabs from "./ChannelTabs";
import UserPanel from "./UserPanel";
import { LoginPage, RegisterPage } from "./AuthPages";
import { useI18n } from "./i18n";
import "./global.css";

export default function App() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useI18n();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
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
  const [route, setRoute] = useState(() => window.location.hash || "#/");

  const [reloadChannelsTrigger, setReloadChannelsTrigger] = useState(0);
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  function getInviteParamsFromLocation() {
    const params = new URLSearchParams(window.location.search);
    const hashQueryStart = window.location.hash.indexOf("?");

    if (hashQueryStart !== -1) {
      const hashParams = new URLSearchParams(window.location.hash.slice(hashQueryStart + 1));
      hashParams.forEach((value, key) => {
        params.set(key, value);
      });
    }

    return params;
  }

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
        setAuthError(data.error || t("auth.loginFailed"));
        return;
      }

      localStorage.setItem("token", data.access_token);
      setAuthToken(data.access_token);
      window.location.hash = "#/";
    } catch {
      setAuthError(t("common.networkError"));
    } finally {
      setAuthLoading(false);
    }
  }

  function doLogout() {
    localStorage.removeItem("token");
    setAuthToken("");
    window.location.hash = "#/login";
  }

  async function doRegister() {
    setRegisterLoading(true);
    setRegisterError("");
    setAuthInfo("");

    const normalizedEmail = registerEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setRegisterError(t("auth.emailRequired"));
      setRegisterLoading(false);
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setRegisterError(t("auth.invalidEmail"));
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
        setRegisterError(data.error || t("auth.registrationFailed"));
        return;
      }

      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedEmail, password: registerPassword }),
      });

      const loginData = await loginRes.json();

      if (!loginData.ok) {
        setUsername(normalizedEmail);
        setPassword("");
        setRegisterEmail("");
        setRegisterPassword("");
        setAuthInfo(t("auth.registrationSuccessLogin"));
        window.location.hash = "#/login";
        return;
      }

      localStorage.setItem("token", loginData.access_token);
      setAuthToken(loginData.access_token);
      setUsername(normalizedEmail);
      setPassword("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterInviteCode("");
      window.location.hash = "#/";
    } catch {
      setRegisterError(t("common.networkError"));
    } finally {
      setRegisterLoading(false);
    }
  }
  
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!authToken && route === "#/") {
      window.location.hash = "#/login";
    }

    if (authToken && (route.startsWith("#/login") || route.startsWith("#/register"))) {
      window.location.hash = "#/";
    }
  }, [authToken, route]);

  useEffect(() => {
    const params = getInviteParamsFromLocation();
    const inviteCodeFromLink = params.get("invite_code");
    const inviteEmailFromLink = params.get("email") || params.get("username");

    if (!inviteCodeFromLink) {
      return;
    }

    const normalizedInviteCode = inviteCodeFromLink.trim();
    const normalizedInviteEmail = (inviteEmailFromLink || "").trim().toLowerCase();

    setRegisterInviteCode(normalizedInviteCode);
    if (!route.startsWith("#/register")) {
      window.location.hash = `#/register?${params.toString()}`;
    }
    setAuthInfo("");
    setRegisterError("");

    if (normalizedInviteEmail) {
      setRegisterEmail(normalizedInviteEmail);
    }
  }, [route]);
  
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
      setInviteError(t("auth.emailRequired"));
      setInviteLoading(false);
      return;
    }

    if (!normalizedInviteEmail.includes("@")) {
      setInviteError(t("auth.invalidEmail"));
      setInviteLoading(false);
      return;
    }

    if (!inviteSubscription.trim()) {
      setInviteError(t("invite.subscriptionRequired"));
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
        setInviteError(data.error || t("invite.failed"));
        return;
      }
      setInviteCode(data.invite.code);
      const inviteParams = new URLSearchParams({
        invite_code: data.invite.code,
        email: data.invite.email,
      });
      setInviteLink(`${window.location.origin}${window.location.pathname}#/register?${inviteParams.toString()}`);

    } catch {
      setInviteError(t("common.networkError"));
    } finally {
      setInviteLoading(false);
    }
  };

  if (!authToken && route.startsWith("#/register")) {
    return (
      <RegisterPage
        registerEmail={registerEmail}
        registerPassword={registerPassword}
        registerInviteCode={registerInviteCode}
        registerError={registerError}
        registerLoading={registerLoading}
        onEmailChange={setRegisterEmail}
        onPasswordChange={setRegisterPassword}
        onRegister={doRegister}
      />
    );
  }

  if (!authToken) {
    return (
      <LoginPage
        username={username}
        password={password}
        authError={authError}
        authInfo={authInfo}
        authLoading={authLoading}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onLogin={doLogin}
      />
    );
  }

  if (addUserOpen) {
    return (
        <div className="center-screen">
          <div className="login-card">
          <h2>{t("invite.title")}</h2>

          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t("invite.emailPlaceholder")}
          />

          <input
            value={inviteSubscription}
            onChange={(e) => setInviteSubscription(e.target.value)}
            placeholder={t("invite.subscriptionPlaceholder")}
          />

          {inviteError && <div className="error">{inviteError}</div>}
          {inviteCode && <div style={{ color: "lightgreen", wordBreak: "break-all" }}>{t("invite.code", { code: inviteCode })}</div>}
          {inviteLink && <div style={{ color: "lightgreen", wordBreak: "break-all" }}>{t("invite.link", { link: inviteLink })}</div>}

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <AppButton onClick={doAddUser} disabled={inviteLoading}>
              {inviteLoading ? t("invite.creating") : t("invite.create")}
            </AppButton>

            <AppButton
              onClick={() => {
                setAddUserOpen(false);
                setInviteCode("");
                setInviteLink("");
                setInviteError("");
              }}
            >
              {t("common.close")}
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
