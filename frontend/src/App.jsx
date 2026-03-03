import React, { useState, useEffect, useRef } from "react";
import FullscreenButton from "./FullscreenButton";
import Sidebar from "./Sidebar";
import VideoStage from "./VideoStage";
import './global.css';



export default function App() {
  const [channelsList, setChannelsList] = useState([]);

  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState("admin");
  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState(localStorage.getItem("token") || "");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);


  const [channel, setChannel] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(0);
  
  const [playerReady, setPlayerReady] = useState(false);

  const [isTransitioning, setIsTransitioning] = useState(true); // fade
  const [isBlackout, setIsBlackout] = useState(true);           // чёрный экран
  const [helloReady, setHelloReady] = useState(false);
  const [helloFinished, setHelloFinished] = useState(false);
  const [helloFinishedTransition, setHelloFinishedTransition] = useState(false);
  
  const [djTransitionReady, setDjTransitionReady] = useState(false);

  const djAudioRef = useRef(null);
  const djDataRef = useRef(null);
  const djHelloDataRef = useRef(null);
  const duckIntervalRef = useRef(null);

  const playerRef = useRef(null);
  const timeoutRef = useRef(null);
  const ytAPILoaded = useRef(false);
  
  const [overlayBearerSrc, setOverlayBearerSrc] = useState(null);
  const [overlaySrc, setOverlaySrc] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const overlayRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [titles, setTitles] = useState({
    topTitle: "",
    topSub: "",
    nowPlaying: "",
    nextTrack: "",
  });

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
      // const channel_name = localStorage.getItem("current_channel");
      // setChannel(channel_name || channelsList[0].name); // теперь можно установить канал
      getMe();
    } catch (e) {
      setAuthError("Network error");
    } finally {
      setAuthLoading(false);
      setChannel(null); // сбросить канал при выходе
    }
  }

  async function getMe() {
    const token = localStorage.getItem("token");
    console.log("Checking auth with");

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
          setUserData(data.user)
          console.log("User:", data.user)
          console.log("Username:", data.user.username)
          setChannelsList(data.user.channels);
          const channel_name = localStorage.getItem("current_channel");
          console.log(channel_name)
          const selected = data.user.channels.find((item) => item.name === channel_name);
          console.log(selected);
          if(selected) {
            // setChannel(channel_name || data.user.channels[0].name); // теперь можно установить канал
            setChannelData(selected);
          } else {
            // setChannel(data.user.channels[0].name); // теперь можно установить канал
            setChannelData(data.user.channels[0]);
          }
        } else {
          setLoginOpen(true);
          localStorage.removeItem("token");
        }
      });
  }

  function doLogout() {
    localStorage.removeItem("token");
    setAuthToken("");
    setChannel(null); // сбросить канал при выходе
    setLoginOpen(true);
  }


  // 1️⃣ Проверка логина
  useEffect(() => {
    getMe();
  }, []);

  // Получаем плейлист
  const loadPlaylist = async () => {
    console.log("Loading playlist");
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8000/playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userData.user_uid, channel_id: channelData.channel_uid, max_results: 10 })
    });
    const data = await res.json();
    setPlaylist(prev => [...prev, ...data.playlist]);
    console.log("Playlist loaded:", data.playlist);
    setIsTransitioning(false);
    return data.playlist; // возвращаем массив сразу
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
      if (djAudioRef.current) {
        const audio = djAudioRef.current;

        audio.pause();        // остановить воспроизведение
        audio.currentTime = 0; // сбросить на начало

        audio.src = "";       // убрать источник
        audio.load();         // прервать загрузку

        djAudioRef.current = null;
      }
      if (overlayRef.current) {
        const video = overlayRef.current;
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      setPlaylist([]);
      setCurrent(0);
      setUserData(null);
      setChannelData(null);
      setHelloReady(false);
      setHelloFinished(false);
      setHelloFinishedTransition(false);
      getMe();
    }, 100); // плавный fade-out

    return () => {
      clearTimeout(fadeOutTimeout);
    };
  }, [channel]);

  useEffect(() => {
    if (!channelData || !userData) return; // только если пользователь залогинен и канал выбран

    const fadeOutTimeout = setTimeout(async () => {
      const playlistData = await loadPlaylist();

      const helloData = await prepareDjHello(playlistData);

      console.log("Hello data:", helloData);

      playDjHelloOverVideo();

      const fadeInTimeout = setTimeout(() => {
        setIsBlackout(false);
      }, helloData.duration * 1000 - 6900); // плавный fade-in

      const helloFinishedTimeout = setTimeout(() => {
        setHelloFinished(true);
      }, helloData.duration * 1000 - 7000); // плавный fade-in

      const helloFinishedTransitionTimeout = setTimeout(() => {
        setHelloFinishedTransition(true);
      }, helloData.duration * 1000 - 10000); // плавный fade-in

      setHelloReady(true)
    }, 100); // плавный fade-out

    return () => {
      clearTimeout(fadeOutTimeout);
    };
  }, [channelData, userData]);

  // Загружаем IFrame API один раз
  useEffect(() => {
    console.log("ytAPILoaded")
    if (ytAPILoaded.current) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    ytAPILoaded.current = true;
  }, []);

  // Создание плеера
  const createPlayer = (videoId) => {
    console.log("createPlayer")
    if (playerRef.current) playerRef.current.destroy();

    setPlayerReady(false);
    
    playerRef.current = new window.YT.Player("player", {
      height: "405",
      width: "720",
      videoId: videoId,
      events: {
        onReady: (event) => {
          console.log("onReady")
          setPlayerReady(true);

          // Ставим громкость на 0
          event.target.setVolume(0);
          // console.log(event.target.getVolume())

          // handleVideoDuration();
          
          const duration = 10000; // общее время разгона (мс)
          const period = 50;

          let elapsed = 0;

          duckIntervalRef.current = setInterval(() => {
            elapsed += period;

            let progress = elapsed / duration;
            if (progress >= 1) {
              progress = 1;
              clearInterval(duckIntervalRef.current);
            }

            // Парабола
            const volume = Math.pow(progress, 2) * 90;

            event.target.setVolume(volume);

          }, period);

        },
        onStateChange: (event) => {
          console.log(event.data)
          // if (event.data === window.YT.PlayerState.ENDED) smoothNext();
        },
      },
      playerVars: {
        autoplay: 1,
        enablejsapi: 1,
        origin: window.location.origin,
        // controls: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3
      }
    });
  };

  useEffect(() => {
    if (!playlist.length || !window.YT || !helloFinished || !channelData) return;

    
    createPlayer(playlist[current].videoId);

    const currentVideoTitle = decodeHtml(playlist[current].artist + " - " + playlist[current].title);
    const nextIndex = (current + 1) % playlist.length;
    const nextVideoTitle = decodeHtml(playlist[nextIndex].artist + " - " + playlist[nextIndex].title);
    setTitles({
      topTitle: channelData?.name ?? "Без названия",
      topSub: channelData?.description ?? "",
      nowPlaying: currentVideoTitle ?? "",
      nextTrack: nextVideoTitle ?? "",
    });

    // заранее готовим DJ
    prepareDjTransition();

  }, [current, playlist, helloFinished, channelData]);

  const prepareDjTransition = async () => {

    setDjTransitionReady(false);

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
        user_id: userData.user_uid, 
        channel_id: channelData.channel_uid,
        from_title: from.artist + " - " + from.title,
        to_title: to.artist + " - " + to.title,
      })
    });

    djDataRef.current = await res.json();

    setDjTransitionReady(true);
  };

  const playDjHelloOverVideo = async () => {
    if (!djHelloDataRef.current || !userData || !channelData) return;

    const token = localStorage.getItem("token");

    console.log(userData)
    console.log(channelData)

    const res = await fetch(
      `http://127.0.0.1:8000/audio?user_id=${userData.user_uid}&channel_id=${channelData.channel_uid}&filename=${djHelloDataRef.current.audio_filename}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error("Audio fetch failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    djAudioRef.current = audio;

    audio.volume = 1;
    audio.play();

    // playerRef.current.setVolume(0);
    // playerRef.current.unMute(); // обязательно, если был mute

    // // 🎚 ducking YouTube
    // let ytVolume = 0;
    // duckIntervalRef.current = setInterval(() => {
    //   ytVolume += 1;
    //   if (ytVolume >= 100) {
    //     ytVolume = 100;
    //     clearInterval(duckIntervalRef.current);
    //   }
    //   playerRef.current.setVolume(ytVolume);
    // }, 500);

    // 🎙 fade-in DJ
    // const fadeIn = setInterval(() => {
    //   audio.volume = Math.min(audio.volume + 0.05, 1);
    //   if (audio.volume >= 1) clearInterval(fadeIn);
    // }, 50);

    audio.onended = () => {
      // возвращаем громкость
      // playerRef.current.setVolume(100);
      // setCurrent(prev => (prev + 1) % playlist.length);
    };
  };

  const prepareDjHello = async (playlistArray) => {
    const to = playlistArray[current]; // берем из параметра
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8000/dj_hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userData.user_uid, 
        channel_id: channelData.channel_uid,
        from_title: "",
        to_title: to.artist + " - " + to.title,
      })
    });
    const data = await res.json();
    djHelloDataRef.current = data;
    djDataRef.current = data;

    setDjTransitionReady(true);

    return data;
  };

  useEffect(() => {
    if (!playerReady || !playerRef.current || !djTransitionReady) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getDuration) return;

      let duration = player.getDuration();
      if (duration > 600) duration = 600;
      duration = duration; // отрубаем 30 секунд в конце для плавного перехода

      const remaining = duration - player.getCurrentTime();

      console.log("Remaining time:", remaining);
      console.log("Current time:", player.getCurrentTime());

      const dj_duration = 15;

      if (djDataRef.current && remaining < dj_duration) {
        console.log("Starting DJ transition, remaining:", remaining);
        clearInterval(interval);
        playOverlayVideo(`http://localhost:8000/video?user_id=${userData.user_uid}&channel_id=${channelData.channel_uid}&filename=default_video.mp4`);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => smoothNext((djDataRef.current.duration - dj_duration) * 1000), (dj_duration) * 1000);
        playDjOverVideo();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [current, playerReady, djTransitionReady]);

  const playDjOverVideo = async () => {
    if (!djDataRef.current || !playerRef.current) return;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://127.0.0.1:8000/audio?user_id=${userData.user_uid}&channel_id=${channelData.channel_uid}&filename=${djDataRef.current.audio_filename}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error("Audio fetch failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    djAudioRef.current = audio;

    audio.volume = 1;
    audio.play();

    const dj_duration = 15;
    const durationMs = (dj_duration) * 1000;
    const period = 50; // частота обновления
    let elapsed = 0;

    duckIntervalRef.current = setInterval(() => {
      elapsed += period;

      let progress = elapsed / durationMs;

      if (progress >= 1) {
        progress = 1;
        clearInterval(duckIntervalRef.current);
      }

      // 🔥 Параболическое затухание
      const volume = Math.pow(1 - progress, 2) * 90;

      if (playerRef.current) {
        playerRef.current.setVolume(volume);
      }

    }, period);
  };

  // Плавный переход клипа через затемнение
  const smoothNext = (timeout = 2000) => {
    setIsTransitioning(true);

    setTimeout(() => {
      handleNext(timeout - 2000);
      setIsTransitioning(false);
    }, 2000);
  };

  // Следующий клип
  const handleNext = (timeout = 0) => {
    if (current === playlist.length - 1 || current === playlist.length - 2) {
      loadPlaylist();
    }

    setTimeout(() => {
      setCurrent(prev => (prev + 1) % playlist.length);
    }, timeout - 10000);
  };

  const prevVideo = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(prev => (prev - 1 + playlist.length) % playlist.length);
      setIsTransitioning(false);
    }, 300);
  };

  // Ограничение 5 минут
  // const handleVideoDuration = () => {
  //   if (!playerRef.current) return;
  //   let duration = playerRef.current.getDuration();
  //   if (duration > 600) {
  //     duration = 600;
  //   }
  //   // duration -= 30; // отрубаем 30 секунд в конце для плавного перехода
  //   clearTimeout(timeoutRef.current);
  //   timeoutRef.current = setTimeout(smoothNext, duration * 1000);
  // };

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
    const token = localStorage.getItem("token");

    const fetchVideo = async () => {
      try {
        const res = await fetch(
          overlayBearerSrc,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

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

      // Встроенный stopTime
      let stopTime = djDataRef.current.duration - 3; // секунд, когда хотим остановить видео
      let total_played = 0

      // Слушаем событие timeupdate
      const onTimeUpdate = () => {
        if (videoEl.currentTime + total_played >= stopTime) {
          videoEl.removeEventListener("timeupdate", onTimeUpdate); // отписываемся
          setOverlayVisible(false);      // fade-out можно делать сразу
          setTimeout(() => {
            videoEl.pause();               // останавливаем
            setOverlaySrc(null);         // убираем видео
          }, 3000); // как у тебя
        }
      };

      videoEl.addEventListener("timeupdate", onTimeUpdate);
      videoEl.addEventListener("loadedmetadata", () => {
        console.log(videoEl.duration);
      });
      videoEl.addEventListener("ended", () => {
        total_played += videoEl.currentTime; // считаем реальное проигранное время, чтобы учесть паузы и перемотки
        videoEl.play();
      });

      // // ждём конца
      // videoEl.onended = () => {
      //   // fade-out
      //   setOverlayVisible(false);

      //   // после fade убираем вообще
      //   setTimeout(() => {
      //     setOverlaySrc(null);
      //   }, 3000);
      // };
    }, 50);
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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

  if (!playlist.length || !helloReady) return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflowX: "hidden",
        backgroundColor: "#000",
        color: "#fff",
        transition: "3s opacity",
        cursor: isFullscreen ? "none" : "default",
        
        display: "flex",           // делаем flex
        justifyContent: "center",  // горизонтальное центрирование
        alignItems: "center",      // вертикальное центрирование
        fontSize: "24px",          // размер текста
      }}
    >

      {/* Fullscreen кнопка */}
      {!isFullscreen && <FullscreenButton />}

      Loading...
    </div>
  );

  if (!helloFinished) return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflowX: "hidden",
        backgroundColor: "#000",
        color: "#fff",
        transition: "3s opacity",
        opacity: !helloFinishedTransition ? 1 : 0,
        cursor: isFullscreen ? "none" : "default",
        
        display: "flex",           // делаем flex
        justifyContent: "center",  // горизонтальное центрирование
        alignItems: "center",      // вертикальное центрирование
        fontSize: "24px",          // размер текста
      }}
    >

      {/* Fullscreen кнопка */}
      {!isFullscreen && <FullscreenButton />}

      Hello! We are starting...
    </div>
  );

  const video = playlist[current];
  const nextIndex = (current + 1) % playlist.length;
  const nextVideoTitle = decodeHtml(playlist[nextIndex].artist + " - " + playlist[nextIndex].title);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "95vh",
        minWidth: "75vw",
        backgroundColor: "#000",
        color: "#fff",
        position: "relative",
        overflowX: "hidden", // убираем горизонтальную прокрутку
        cursor: isFullscreen ? "none" : "default",
      }}
    >
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
          transition: "10s opacity",
          zIndex: 999,
        }}
      />

      {/* Fullscreen кнопка */}
      {!isFullscreen && <FullscreenButton />}

      {/* Sidebar — 25% ширины */}
      {!isFullscreen && (
        <div style={{ flexBasis: "25%", padding: "20px", borderRight: "1px solid #333" }}>
          <Sidebar
            authToken={authToken}
            setLoginOpen={setLoginOpen}
            doLogout={doLogout}
            channelsList={channelsList}
            channel={channel}
            setChannel={setChannel}
          />
        </div>
      )}

      {/* Основной контент — 75% ширины */}
      <div
        style={{
          flexGrow: 1,
          textAlign: "center",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <VideoStage
          isTransitioning={isTransitioning}
          overlaySrc={overlaySrc}
          overlayRef={overlayRef}
          overlayVisible={overlayVisible}
          titles={titles}
          isFullscreen={isFullscreen}
        />

        {!isFullscreen && (
          <div
            style={{
              marginTop: "15px",
              display: "flex",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            <button               
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={smoothNext}
              >
                Следующий ⏭
              </button>
          </div>
        )}
      </div>
    </div>


  );
}
