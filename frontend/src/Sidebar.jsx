import React from "react";
import { useI18n } from "./i18n";

export default function Sidebar({
  authToken,
  setLoginOpen,
  doLogout,
  channelsList,
  channel,
  setChannel,
}) {
  const { t } = useI18n();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
        {!authToken ? (
          <button
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={() => setLoginOpen(true)}
          >
            {t("auth.loginButton")}
          </button>
        ) : (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#aaa" }}>{t("auth.loggedIn")}</span>
            <button
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={doLogout}
            >
              {t("userPanel.logout")}
            </button>
          </div>
        )}
      </div>

      <h2>{t("channels.title")}</h2>

      {channelsList.map((ch) => (
        <div
          key={ch.name}
          onClick={() => setChannel(ch.name)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px",
            margin: "5px 0",
            cursor: "pointer",
            backgroundColor: ch.name === channel ? "#444" : "transparent",
            borderRadius: "5px",
            transition: "0.2s all",
          }}
        >
          <span>{ch.icon}</span>
          <span>{ch.name}</span>
        </div>
      ))}
    </div>
  );
}
