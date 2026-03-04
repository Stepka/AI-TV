import React, { useEffect, useState } from "react";
import Playlist from "./Playlist";
import ChannelDescription from "./ChannelDescription";
import Stage from "./Stage";

export default function ChannelTabs({ token, userData, channel }) {
  const [activeTab, setActiveTab] = useState("description");
    
  const [isFullscreen, setIsFullscreen] = useState(false);
    
  useEffect(() => {
    const onFsChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div
      style={{
        width: "100%",          // растягиваем на всю ширину родителя
        flexGrow: 1,
        background: "rgba(0,0,0,0.3)",
        borderRadius: 12,
        padding: isFullscreen ? 0 : 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Заголовок с вкладками */}
      {!isFullscreen && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <button
            onClick={() => setActiveTab("description")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "description" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("stage")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "stage" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            DJ Stream
          </button>
        </div>
      )}

      {/* Контент вкладки */}
      <div style={{ flexGrow: 1, overflowY: "auto" }}>
        {activeTab === "description" && <ChannelDescription channel={channel} />}
        {activeTab === "stage" && <Stage token={token} userData={userData} channel={channel} />}
      </div>
    </div>
  );
}