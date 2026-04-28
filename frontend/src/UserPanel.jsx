import React, { useEffect, useState } from "react";
import AppButton from "./AppButton";
import YoutubeLoginButton from "./YoutubeLoginButton";
import { useI18n } from "./i18n";

const LANGUAGE_OPTIONS = [
  { value: "ru", label: "RU", flag: "ru" },
  { value: "en", label: "EN", flag: "en" },
];

export default function UserPanel({ token, onLogout, onGetUserData, onAddUser }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { locale, setLocale, t } = useI18n();

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
          setError(t("userPanel.failedToLoadUser"));
          return;
        }

        console.log(data.user);

        setUserData(data.user);
        onGetUserData(data.user);
      } catch (err) {
        setError(t("common.networkError"));
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  return (
    <header className="user-panel">
      <h1>{t("common.aiTv")}</h1>

      <div className="user-panel-actions">
        <div className="language-switcher" aria-label="Language">
          {LANGUAGE_OPTIONS.map((language) => (
            <button
              key={language.value}
              type="button"
              className={`language-option ${locale === language.value ? "active" : ""}`}
              onClick={() => setLocale(language.value)}
              aria-pressed={locale === language.value}
              title={language.label}
            >
              <span className={`language-flag language-flag-${language.flag}`} aria-hidden="true" />
              <span>{language.label}</span>
            </button>
          ))}
        </div>

        {loading && <span style={{ opacity: 0.6 }}>{t("common.loading")}</span>}
        {error && <span style={{ color: "tomato" }}>{error}</span>}
        {!loading && !error && <span>{userData?.username}</span>}
        {!loading && !error && <span>{t("userPanel.subscription", { name: userData?.subscription.name })}</span>}

        <AppButton onClick={onLogout}>
          {t("userPanel.logout")}
        </AppButton>

        {userData?.role == "admin" && (
          <AppButton onClick={onAddUser}>
            {t("userPanel.createInvite")}
          </AppButton>
        )}

        {/* <YoutubeLoginButton/> */}
      </div>
    </header>
  );
}
