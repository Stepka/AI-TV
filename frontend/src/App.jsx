import React, { useState, useEffect, useRef } from "react";

export default function App() {
  const channelsList = [
    { name: "MTV", icon: "🎵" },
    { name: "Retro", icon: "🎶" },
  ];

  const [channel, setChannel] = useState(channelsList[0].name);
  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(0);
  const playerRef = useRef(null);
  const timeoutRef = useRef(null);
  const ytAPILoaded = useRef(false);

  // Получаем плейлист
  const loadPlaylist = async () => {
    const res = await fetch("http://127.0.0.1:8000/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, max_results: 10 })
    });
    const data = await res.json();
    setPlaylist(prev => [...prev, ...data.playlist]);
  };

  useEffect(() => {
    setPlaylist([]); // очищаем предыдущий
    setCurrent(0);
    loadPlaylist();
  }, [channel]);

  // Загружаем скрипт IFrame API один раз
  useEffect(() => {
    if (ytAPILoaded.current) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    ytAPILoaded.current = true;
  }, []);

  // Создание плеера
  const createPlayer = (videoId) => {
    if (playerRef.current) playerRef.current.destroy();
    playerRef.current = new window.YT.Player("player", {
      height: "405",
      width: "720",
      videoId: videoId,
      events: {
        onReady: () => handleVideoDuration(),
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) handleNext();
        },
      },
      playerVars: { autoplay: 1, rel: 0 },
    });
  };

  // Переход на следующий клип
  const handleNext = () => {
    // Если последний клип — догружаем ещё
    if (current === playlist.length - 1) {
      loadPlaylist(); // добавляем ещё 10 клипов
    }
    setCurrent(prev => (prev + 1) % playlist.length);
  };

  const prevVideo = () => {
    setCurrent(prev => (prev - 1 + playlist.length) % playlist.length);
  };

  // Ограничение на 5 минут
  const handleVideoDuration = () => {
    if (!playerRef.current) return;
    const duration = playerRef.current.getDuration();
    if (duration > 300) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleNext, 300 * 1000);
    }
  };

  // Обновляем плеер при смене current или playlist
  useEffect(() => {
    if (!playlist.length || !window.YT) return;
    createPlayer(playlist[current].videoId);
  }, [current, playlist]);

  // Декодируем HTML сущности
  const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  if (!playlist.length) return <div>Loading...</div>;

  const video = playlist[current];
  const nextIndex = (current + 1) % playlist.length;
  const nextVideoTitle = decodeHtml(playlist[nextIndex].title);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#000", color: "#fff" }}>
      
      {/* Боковое меню */}
      <div style={{ width: "200px", padding: "20px", borderRight: "1px solid #333" }}>
        <h2>Каналы</h2>
        {channelsList.map((ch) => (
          <div
            key={ch.name}
            onClick={() => {
              setChannel(ch.name);
              setCurrent(0);
              clearTimeout(timeoutRef.current);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px",
              margin: "5px 0",
              cursor: "pointer",
              backgroundColor: ch.name === channel ? "#444" : "transparent",
              borderRadius: "5px",
              transition: "0.2s all"
            }}
          >
            <span>{ch.icon}</span>
            <span>{ch.name}</span>
          </div>
        ))}
      </div>

      {/* Основной контент */}
      <div style={{ flex: 1, textAlign: "center", padding: "20px" }}>
        <h1 style={{ transition: "0.3s opacity", opacity: 1 }}>{decodeHtml(video.title)}</h1>

        {/* Плеер */}
        <div id="player" style={{ marginTop: "20px", transition: "0.3s opacity", opacity: 1 }}></div>

        {/* Кнопки навигации */}
        <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "15px" }}>
          <button
            onClick={prevVideo}
            style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
          >
            ⏮ Предыдущий
          </button>
          <button
            onClick={handleNext}
            style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
          >
            Следующий ⏭
          </button>
        </div>

        {/* Подсказка следующего клипа */}
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#aaa" }}>
          Следующий: {nextVideoTitle}
        </div>
      </div>
    </div>
  );
}
