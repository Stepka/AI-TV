import React, { useEffect, useState } from "react";

export default function ChannelList({ token, onSelectChannel }) {
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
        const res = await fetch("http://localhost:8000/channels", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!data.ok) {
          setError("Failed to load channels");
          return;
        }

        const list = data.channels || [];
        setChannels(list);

        // если ранее выбранного нет — выбираем первый
        if (!selectedChannel && list.length > 0) {
          handleSelect(list[0]);
        } else if (selectedChannel) {
          // если выбранный канал больше не доступен — сбрасываем выбор
          const exists = list.some(ch => ch.channel_uid === selectedChannel);
          if (exists) {
            handleSelect(list.find(ch => ch.channel_uid === selectedChannel));
          } else {
            setSelectedChannel(null);
            localStorage.removeItem("current_channel");
          }
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    loadChannels();
  }, [token]);

  function handleSelect(channel) {
    setSelectedChannel(channel.channel_uid);
    localStorage.setItem("current_channel", channel.channel_uid);
    onSelectChannel && onSelectChannel(channel);
  }


  if (loading) return <div>Loading channels...</div>;
  if (error) return <div style={{ color: "tomato" }}>{error}</div>;
  if (!channels.length) return <div>No channels available</div>;

  return (
    <div className="channel-list-wrapper">
      <div className="channel-list">
        {channels.map(channel => (
          <div
            key={channel.channel_uid}
            className={`channel-item ${selectedChannel === channel.channel_uid ? "active" : ""}`}
            onClick={() => handleSelect(channel)}
          >
            {channel.name}
          </div>
        ))}
      </div>
    </div>
  );
}