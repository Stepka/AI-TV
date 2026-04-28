import React, { useEffect, useState } from "react";
import AppButton from "./AppButton";
import { useI18n } from "./i18n";

export default function ChannelList({ token, userData, onSelectChannel, reloadChannelsTrigger }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useI18n();
  const isFreeSubscription = userData?.subscription?.name === "free";

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(
    localStorage.getItem("current_channel") || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadChannels() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_URL}/channels`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!data.ok) {
          setError(t("channels.failedToLoad"));
          return;
        }

        const list = data.channels || [];
        setChannels(list);

        if (!selectedChannel && list.length > 0) {
          handleSelect(list[0]);
        } else if (selectedChannel) {
          const exists = list.some((ch) => ch.channel_uid === selectedChannel);
          if (exists) {
            handleSelect(list.find((ch) => ch.channel_uid === selectedChannel));
          } else {
            setSelectedChannel(null);
            localStorage.removeItem("current_channel");
          }
        }
      } catch {
        setError(t("common.networkError"));
      } finally {
        setLoading(false);
      }
    }

    loadChannels();
  }, [token, reloadChannelsTrigger]);

  function handleSelect(channel) {
    setSelectedChannel(channel.channel_uid);
    localStorage.setItem("current_channel", channel.channel_uid);
    onSelectChannel && onSelectChannel(channel);
  }

  const handleAddChannel = () => {
    const newChannel = {
      channel_uid: crypto.randomUUID(),
      name: t("channels.newChannel"),
      type: "brand_space",
      style: "",
      description: "",
      location: "",
      voice: { source: "silero", name: "xenia", sex: "female" },
      actions: [],
      menu: [],
    };

    setChannels((prev) => [...prev, newChannel]);
    handleSelect(newChannel);
  };

  if (loading) return <div>{t("channels.loading")}</div>;
  if (error) return <div style={{ color: "tomato" }}>{error}</div>;
  if (!channels.length) {
    return (
      <div className="channel-list-wrapper">
        <div>{t("channels.empty")}</div>
        {!isFreeSubscription && (
          <AppButton onClick={handleAddChannel} style={{ marginTop: 8, width: "fit-content" }}>
            {t("channels.add")}
          </AppButton>
        )}
      </div>
    );
  }

  return (
    <div className="channel-list-wrapper">
      <div className="channel-list">
        {channels.map((channel) => (
          <div
            key={channel.channel_uid}
            className={`channel-item ${selectedChannel === channel.channel_uid ? "active" : ""}`}
            onClick={() => handleSelect(channel)}
          >
            {channel.name}
          </div>
        ))}
      </div>

      {!isFreeSubscription && (
        <AppButton onClick={handleAddChannel} style={{ marginTop: 8, width: "fit-content" }}>
          {t("channels.add")}
        </AppButton>
      )}

      {!isFreeSubscription && <span>{t("channels.available", { count: userData?.channels_num })}</span>}
    </div>
  );
}
