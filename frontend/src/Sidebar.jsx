import React from "react";

export default function Sidebar({
  authToken,
  setLoginOpen,
  doLogout,
  channelsList,
  channel,
  setChannel,
}) {
  return (
    <div>
      {/* AUTH TOP BAR */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
        {!authToken ? (
          <button onClick={() => setLoginOpen(true)}>🔐 Login</button>
        ) : (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "#aaa" }}>✅ Logged in</span>
            <button onClick={doLogout}>Logout</button>
          </div>
        )}
      </div>

      <h2>Каналы</h2>

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
