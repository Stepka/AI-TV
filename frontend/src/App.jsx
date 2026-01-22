import React, { useState, useEffect } from "react";

export default function App() {
  const [channel, setChannel] = useState("MTV");
  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(0);

  // Получаем плейлист с бекенда
  useEffect(() => {
    fetch("http://127.0.0.1:8000/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, max_results: 10 })
    })
      .then(res => res.json())
      .then(data => { setPlaylist(data.playlist); setCurrent(0); });
  }, [channel]);

  // Автоплей видео через таймер (упрощённо)
  useEffect(() => {
    if (!playlist.length) return;

    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % playlist.length);
    }, 30000); // смена каждые 30 секунд, можно потом заменить на IFrame API

    return () => clearInterval(interval);
  }, [playlist]);

  if (!playlist.length) return <div>Loading...</div>;

  const video = playlist[current];

  return (
    <div style={{ textAlign: "center", backgroundColor: "#000", color: "#fff", minHeight: "100vh" }}>
      <h1>AI-TV</h1>
      <select
        value={channel}
        onChange={e => { setChannel(e.target.value); setCurrent(0); }}
        style={{ marginBottom: "20px", fontSize: "16px", padding: "5px" }}
      >
        <option value="MTV">MTV</option>
        <option value="Retro">Retro</option>
      </select>

      <h2>{video.title}</h2>
      <iframe
        width="720"
        height="405"
        src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
      ></iframe>
    </div>
  );
}
