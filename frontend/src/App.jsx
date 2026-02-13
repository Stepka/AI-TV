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

  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("1234");
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);


  const [channel, setChannel] = useState(null);
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
  
  const [overlayBearerSrc, setOverlayBearerSrc] = useState(null);
  const [overlaySrc, setOverlaySrc] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const overlayRef = useRef(null);


  async function doLogin() {
    setAuthLoading(true);
    setAuthError("");

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.ok) {
        setAuthError(data.error || "Login failed");
        setAuthLoading(false);
        return;
      }

      localStorage.setItem("token", data.access_token);
      setAuthToken(data.access_token);
      setLoginOpen(false);
      const channel_name = localStorage.getItem("current_channel");
      setChannel(channel_name || channelsList[0].name); // теперь можно установить канал
    } catch (e) {
      setAuthError("Network error");
    } finally {
      setAuthLoading(false);
    }
  }

  function doLogout() {
    localStorage.removeItem("token");
    setAuthToken("");
    setChannel(null); // сбросить канал при выходе
    setLoginOpen(true);
  }


  // 1️⃣ Проверка логина
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Checking auth with token:", token);

    if (!token) {
      setLoginOpen(true);
      return;
    }

    fetch("http://localhost:8000/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setUsername(data.user.username);
          const channel_name = localStorage.getItem("current_channel");
          setChannel(channel_name || channelsList[0].name); // теперь можно установить канал
        } else {
          setLoginOpen(true);
          localStorage.removeItem("token");
        }
      });
  }, []);

  // Получаем плейлист
  const loadPlaylist = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8000/playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ channel, max_results: 10 })
    });
    const data = await res.json();
    setPlaylist(prev => [...prev, ...data.playlist]);
    setIsTransitioning(false);
  };

  // // При смене канала — через чёрный экран
  // useEffect(() => {
  //   setIsBlackout(true);

  //   setTimeout(() => {
  //     setPlaylist([]);
  //     setCurrent(0);
  //     clearTimeout(timeoutRef.current);
  //     loadPlaylist();

  //     setTimeout(() => {
  //       setIsBlackout(false);
  //     }, 300);
  //   }, 300);
  // }, [channel]);

  // 2️⃣ Эффект смены канала
  useEffect(() => {
    if (!channel) return; // только если пользователь залогинен и канал выбран

    localStorage.setItem("current_channel", channel); // сохраняем выбор канала

    setIsBlackout(true);

    const fadeOutTimeout = setTimeout(async () => {
      setPlaylist([]);
      setCurrent(0);
      await loadPlaylist();

      const fadeInTimeout = setTimeout(() => {
        setIsBlackout(false);
      }, 1000); // плавный fade-in
    }, 1000); // плавный fade-out

    return () => {
      clearTimeout(fadeOutTimeout);
    };
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

    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8000/dj_transition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
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

      console.log("Remaining time:", remaining);

      if (remaining < 30.5) {
        clearInterval(interval);
        playOverlayVideo("http://localhost:8000/video?channel=drugoe_mesto&filename=13637307_1920_1080_24fps.mp4");
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(smoothNext, 30 * 1000);
        playDjOverVideo();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [current, playerReady]);

  const playDjOverVideo = async () => {
    if (!djDataRef.current || !playerRef.current) return;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://127.0.0.1:8000/audio?channel=drugoe_mesto&filename=${djDataRef.current.audio_filename}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error("Audio fetch failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
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

  useEffect(() => {
    if (!overlayBearerSrc) return; // например djDataRef.current.video_filename
    console.log("Fetching overlay video:", overlayBearerSrc);

    const token = localStorage.getItem("token");

    const fetchVideo = async () => {
      console.log("Fetching video: ", overlayBearerSrc);
      try {
        const res = await fetch(
          overlayBearerSrc,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Video fetch response:", res);

        if (!res.ok) throw new Error("Failed to fetch video");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setOverlaySrc(url); // state, который используешь в src
      } catch (err) {
        console.error(err);
      }
    };

    fetchVideo();

    // очищаем объект URL при размонтировании
    return () => {
      if (overlaySrc) URL.revokeObjectURL(overlaySrc);
    };
  }, [overlayBearerSrc]);

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

  if (loginOpen) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#000", color: "#fff", position: "relative" }}>
        {/* LOGIN MODAL */}
        {loginOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
            }}
            onClick={() => setLoginOpen(false)}
          >
            <div
              style={{
                width: "320px",
                background: "#111",
                border: "1px solid #333",
                borderRadius: "12px",
                padding: "18px",
                textAlign: "left",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginTop: 0 }}>Login</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #333", background: "#000", color: "#fff" }}
                />

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  type="password"
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #333", background: "#000", color: "#fff" }}
                />

                {authError && <div style={{ color: "tomato", fontSize: "14px" }}>{authError}</div>}

                <button onClick={doLogin} disabled={authLoading}>
                  {authLoading ? "Logging in..." : "Login"}
                </button>

                <button onClick={() => setLoginOpen(false)} style={{ opacity: 0.7 }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>);    

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
