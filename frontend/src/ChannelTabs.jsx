import React, { useEffect, useState } from "react";
import Playlist from "./Playlist";
import ChannelDescription from "./ChannelDescription";
import ChannelManager from "./ChannelManager";
import Stage from "./Stage";
import AIAudioLibrary from "./AIAudioLibrary";
import BrandPhrasesLibrary from "./BrandPhrasesLibrary";
import AdPhrasesLibrary from "./AdPhrasesLibrary";

export default function ChannelTabs({ token, userData, channel, onEditChannel, onDeleteChannel }) {
  const [activeTab, setActiveTab] = useState("stage");
    
  const [isFullscreen, setIsFullscreen] = useState(false);
    
  useEffect(() => {
    const onFsChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);
  
  
  useEffect(() => {
    setActiveTab("stage")
  }, [channel]);

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
        height: "100%", // или 100vh или фиксированная высота
        gap: 12,
      }}
    >
      {/* Заголовок с вкладками */}
      {!isFullscreen && (
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
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
          <button
            onClick={() => setActiveTab("channelManager")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "channelManager" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Edit Channel
          </button>
          <button
            onClick={() => setActiveTab("aiAudioLibrary")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "aiAudioLibrary" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            AI Audio Library
          </button>
          <button
            onClick={() => setActiveTab("brandPhrases")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "brandPhrases" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Brand Phrases
          </button>
          <button
            onClick={() => setActiveTab("adPhrases")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === "adPhrases" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Ad Phrases
          </button>
        </div>
      )}

      {/* Контент вкладки */}
      <div style={{ flexGrow: 1, overflowY: "auto", minHeight: 0 }}>
        {activeTab === "stage" && <Stage token={token} userData={userData} channel={channel} />}
        {activeTab === "channelManager" && <ChannelManager token={token} userData={userData} channel={channel} onSave={onEditChannel} onDelete={onDeleteChannel} />}
        {activeTab === "aiAudioLibrary" && <AIAudioLibrary token={token} userData={userData} channel={channel} />}
        {activeTab === "brandPhrases" && <BrandPhrasesLibrary token={token} userData={userData} channel={channel} />}
        {activeTab === "adPhrases" && <AdPhrasesLibrary token={token} userData={userData} channel={channel} />}
      </div>
    </div>
  );
}