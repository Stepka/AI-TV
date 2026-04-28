import React, { useEffect, useState } from "react";
import Playlist from "./Playlist";
import ChannelDescription from "./ChannelDescription";
import ChannelManager from "./ChannelManager";
import Stage from "./Stage";
import AIAudioLibrary from "./AIAudioLibrary";
import VideoLibrary from "./VideoLibrary";
import BrandPhrasesLibrary from "./BrandPhrasesLibrary";
import AdPhrasesLibrary from "./AdPhrasesLibrary";
import { useI18n } from "./i18n";

export default function ChannelTabs({ token, userData, channel, onEditChannel, onDeleteChannel }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("stage");
  const isFreeSubscription = userData?.subscription?.name === "free";

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    setActiveTab("stage");
  }, [channel]);

  useEffect(() => {
    if (!isFreeSubscription) return;

    const freeHiddenTabs = ["channelManager", "brandPhrases", "adPhrases", "aiAudioLibrary", "videoLibrary"];
    if (freeHiddenTabs.includes(activeTab)) {
      setActiveTab("stage");
    }
  }, [isFreeSubscription, activeTab]);

  return (
    <div
      style={{
        width: "100%",
        flexGrow: 1,
        background: "rgba(0,0,0,0.3)",
        borderRadius: 12,
        padding: isFullscreen ? 0 : 20,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 12,
      }}
    >
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
            {t("tabs.stage")}
          </button>

          {!isFreeSubscription && (
            <>
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
                {t("tabs.editChannel")}
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
                {t("tabs.brandPhrases")}
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
                {t("tabs.adPhrases")}
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
                {t("tabs.aiAudioLibrary")}
              </button>
              <button
                onClick={() => setActiveTab("videoLibrary")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: activeTab === "videoLibrary" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {t("tabs.videoLibrary")}
              </button>
            </>
          )}
        </div>
      )}

      <div
        style={{
          flexGrow: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflowY: activeTab === "stage" ? "hidden" : "auto",
        }}
      >
        {activeTab === "stage" && <Stage token={token} userData={userData} channel={channel} />}
        {!isFreeSubscription && activeTab === "channelManager" && <ChannelManager token={token} userData={userData} channel={channel} onSave={onEditChannel} onDelete={onDeleteChannel} />}
        {!isFreeSubscription && activeTab === "brandPhrases" && <BrandPhrasesLibrary token={token} userData={userData} channel={channel} />}
        {!isFreeSubscription && activeTab === "adPhrases" && <AdPhrasesLibrary token={token} userData={userData} channel={channel} />}
        {!isFreeSubscription && activeTab === "aiAudioLibrary" && <AIAudioLibrary token={token} userData={userData} channel={channel} />}
        {!isFreeSubscription && activeTab === "videoLibrary" && <VideoLibrary token={token} userData={userData} channel={channel} />}
      </div>
    </div>
  );
}
