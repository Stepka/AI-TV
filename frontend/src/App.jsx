import React, { useState, useEffect, useRef } from "react";

export default function App() {
  const channelsList = [
    { name: "MTV", icon: "🎵" },
    { name: "Retro", icon: "🎶" },
    { name: "Retro Synth", icon: "🎛️" },
    { name: "A One", icon: "⭐" },
    { name: "Другое Место", icon: "☕" },
    { name: "Пеперончино", icon: "🍕" },
    { name: "X-Fit", icon: "🏋️" },
    { name: "Эдкар", icon: "🏥" },
    { name: "Exeed", icon: "🚗" },
    { name: "О, Pretty People", icon: "💅" },
    { name: "OldBoy", icon: "💈" },
  ];

  const [channel, setChannel] = useState(channelsList[4].name);
  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(0);
  
  const [playerReady, setPlayerReady] = useState(false);

  const [isTransitioning, setIsTransitioning] = useState(true); // fade
  const [isBlackout, setIsBlackout] = useState(true);           // чёрный экран

  const djAudioRef = useRef(null);
  const djDataRef = useRef(null);
  const duckIntervalRef = useRef(null);

  const playerRef = useRef(null);
  const timeoutRef = useRef(null);
  const ytAPILoaded = useRef(false);

  const [overlaySrc, setOverlaySrc] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const overlayRef = useRef(null);


  // Старт — появление из темноты
  useEffect(() => {
    setTimeout(() => {
      setIsBlackout(false);
      setIsTransitioning(false);
    }, 500);
  }, []);

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

  // При смене канала — через чёрный экран
  useEffect(() => {
    setIsBlackout(true);

    setTimeout(() => {
      setPlaylist([]);
      setCurrent(0);
      clearTimeout(timeoutRef.current);
      loadPlaylist();

      setTimeout(() => {
        setIsBlackout(false);
      }, 300);
    }, 300);
  }, [channel]);

  // Загружаем IFrame API один раз
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

    setPlayerReady(false);
    
    playerRef.current = new window.YT.Player("player", {
      height: "405",
      width: "720",
      videoId: videoId,
      events: {
        onReady: () => {
          setPlayerReady(true);
          handleVideoDuration();
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) smoothNext();
        },
      },
      playerVars: { autoplay: 1, rel: 0 },
    });
  };

  useEffect(() => {
    if (!playlist.length || !window.YT) return;

    createPlayer(playlist[current].videoId);

    // заранее готовим DJ
    prepareDjTransition();

  }, [current, playlist]);

  const prepareDjTransition = async () => {
    const from = playlist[current];
    const to = playlist[(current + 1) % playlist.length];

    const res = await fetch("http://127.0.0.1:8000/dj_transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        from_title: from.artist + " - " + from.title,
        to_title: to.artist + " - " + to.title,
      })
    });

    djDataRef.current = await res.json();
  };

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getDuration) return;

      let duration = player.getDuration();
      if (duration > 600) duration = 600;
      duration = duration - 30; // отрубаем 30 секунд в конце для плавного перехода

      const remaining = duration - player.getCurrentTime();

      if (remaining < 30.5) {
        clearInterval(interval);
        playDjOverVideo();
        playOverlayVideo("http://localhost:8000/video?channel=drugoe_mesto&filename=13637307_1920_1080_24fps.mp4");
      }
    }, 500);

    return () => clearInterval(interval);
  }, [current, playerReady]);

  const playDjOverVideo = () => {
    if (!djDataRef.current || !playerRef.current) return;

    const audio = new Audio(
      `http://127.0.0.1:8000/audio?filename=${djDataRef.current.audio_filename}`
    );
    djAudioRef.current = audio;

    audio.volume = 0;
    audio.play();

    // 🎚 ducking YouTube
    let ytVolume = 100;
    duckIntervalRef.current = setInterval(() => {
      ytVolume -= 5;
      if (ytVolume <= 30) {
        ytVolume = 30;
        clearInterval(duckIntervalRef.current);
      }
      playerRef.current.setVolume(ytVolume);
    }, 50);

    // 🎙 fade-in DJ
    const fadeIn = setInterval(() => {
      audio.volume = Math.min(audio.volume + 0.05, 1);
      if (audio.volume >= 1) clearInterval(fadeIn);
    }, 50);

    audio.onended = () => {
      // возвращаем громкость
      playerRef.current.setVolume(100);
      // setCurrent(prev => (prev + 1) % playlist.length);
    };
  };


  // Плавный переход клипа через затемнение
  const smoothNext = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      handleNext();
      setIsTransitioning(false);
    }, 2000);
  };

  // Следующий клип
  const handleNext = () => {
    if (current === playlist.length - 1) {
      loadPlaylist();
    }
    setCurrent(prev => (prev + 1) % playlist.length);
  };

  const prevVideo = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(prev => (prev - 1 + playlist.length) % playlist.length);
      setIsTransitioning(false);
    }, 300);
  };

  // Ограничение 5 минут
  const handleVideoDuration = () => {
    if (!playerRef.current) return;
    console.log("Video duration:", playerRef.current.getDuration());
    let duration = playerRef.current.getDuration();
    if (duration > 600) {
      duration = 600;
    }
    duration -= 30; // отрубаем 30 секунд в конце для плавного перехода
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(smoothNext, duration * 1000);
  };

  // Обновляем плеер при смене клипа
  // useEffect(() => {
  //   if (!playlist.length || !window.YT) return;
  //   createPlayer(playlist[current].videoId);
  // }, [current, playlist]);

  // Декодируем HTML сущности
  const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const playOverlayVideo = async (src) => {
    setOverlaySrc(src);

    // даём React отрендерить video
    setTimeout(async () => {
      const videoEl = overlayRef.current;
      if (!videoEl) return;

      try {
        videoEl.currentTime = 0;
        await videoEl.play();
      } catch (e) {
        console.log("overlay play blocked:", e);
      }

      // fade-in
      setOverlayVisible(true);

      // ждём конца
      videoEl.onended = () => {
        // fade-out
        setOverlayVisible(false);

        // после fade убираем вообще
        setTimeout(() => {
          setOverlaySrc(null);
        }, 2000);
      };
    }, 50);
  };


  if (!playlist.length) return <div>Loading...</div>;

  const video = playlist[current];
  const nextIndex = (current + 1) % playlist.length;
  const nextVideoTitle = decodeHtml(playlist[nextIndex].artist + " - " + playlist[nextIndex].title);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#000", color: "#fff", position: "relative" }}>
      
      {/* BLACKOUT OVERLAY */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          opacity: isBlackout ? 1 : 0,
          pointerEvents: "none",
          transition: "0.5s opacity",
          zIndex: 999
        }}
      />

      {/* Боковое меню */}
      <div style={{ width: "200px", padding: "20px", borderRight: "1px solid #333" }}>
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

        {/* Название */}
        <h1
          style={{
            transition: "0.3s opacity",
            opacity: isTransitioning ? 0 : 1
          }}
        >
          {decodeHtml(video.artist + " - " + video.title)}
        </h1>

        {/* Плеер */}
        <div
          style={{
            position: "relative",
            width: "720px",
            height: "405px", // 720x405 = 16:9
            margin: "20px auto",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#000"
          }}
        >
          {/* YouTube */}
          <div
            id="player"
            style={{
              position: "absolute",
              transition: "2.0s opacity",
              opacity: isTransitioning ? 0 : 1,
              inset: 0,
              width: "100%",
              height: "100%",
              zIndex: 1
            }}
          />

          {/* ТВОЁ ВИДЕО поверх */}
          {overlaySrc && (
            <video
              ref={overlayRef}
              src={overlaySrc}
              playsInline
              autoPlay
              muted
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 50,
                opacity: overlayVisible ? 1 : 0,
                transition: "opacity 2.0s ease",
                pointerEvents: "none"
              }}
            />
          )}
        </div>

        {/* <div
          style={{
            marginTop: "20px",
            transition: "0.3s opacity",
            opacity: isTransitioning ? 0 : 1
          }}
        >
          <div id="player" />

          <video
            src="http://localhost:8000/video?channel=drugoe_mesto&filename=13637307_1920_1080_24fps.mp4"
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 10,
              pointerEvents: "none" // чтобы клики шли в ютуб
            }}
          />
        </div> */}

        {/* Кнопки */}
        <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "15px" }}>
          <button onClick={prevVideo}>⏮ Предыдущий</button>
          <button onClick={smoothNext}>Следующий ⏭</button>
        </div>

        {/* Подсказка следующего клипа */}
        <div style={{ marginTop: "10px", fontSize: "14px", color: "#aaa" }}>
          Следующий: {nextVideoTitle}
        </div>
      </div>
    </div>
  );
}
