import React, { useState, useEffect, useRef } from "react";
import FullscreenButton from "./FullscreenButton";
import AppButton from "./AppButton";
import VideoStage from "./VideoStage";
import Playlist from "./Playlist";
import './global.css';



export default function App({ token, userData, channel }) {
  const API_URL = import.meta.env.VITE_API_URL;
  
  const [isStreaming, setIsStreaming] = useState(false);

  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(0);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistReady, setPlaylistReady] = useState(false);  
  
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

  useEffect(() => {
    if (!channel || !userData || !isStreaming || playlist.length === 0) return; // только если пользователь залогинен и канал выбран

    const fadeOutTimeout = setTimeout(async () => {

      const helloData = await prepareDjHello(playlist);

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
        setIsTransitioning(false);
      }, helloData.duration * 1000 - 10000); // плавный fade-in

      setHelloReady(true)
    }, 100); // плавный fade-out

    return () => {
      clearTimeout(fadeOutTimeout);
    };
  }, [isStreaming, playlistReady]);

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
      host: "https://www.youtube.com",
      videoId: videoId,
      events: {
        onReady: (event) => {
          console.log("onReady")
          setPlayerReady(true);

          // Ставим громкость на 0
          event.target.setVolume(0);
          
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
        },
      },
      playerVars: {
        autoplay: 1,
        enablejsapi: 1,
        // origin: window.location.origin,
        // controls: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3
      }
    });
  };

  useEffect(() => {
    if (!playlist.length || !window.YT || !helloFinished || !channel || !isStreaming) return;

    console.log(channel);
    console.log("Creating player for videoId:", playlist[current].videoId);
    createPlayer(playlist[current].videoId);

    const currentVideoTitle = decodeHtml(playlist[current].artist + " - " + playlist[current].title);
    const nextIndex = (current + 1) % playlist.length;
    const nextVideoTitle = decodeHtml(playlist[nextIndex].artist + " - " + playlist[nextIndex].title);
    setTitles({
      topTitle: channel?.name ?? "Без названия",
      topSub: channel?.description ?? "",
      nowPlaying: currentVideoTitle ?? "",
      nextTrack: nextVideoTitle ?? "",
    });

    // заранее готовим DJ
    prepareDjTransition();

  }, [current, helloFinished, isStreaming]);

  const prepareDjTransition = async () => {

    setDjTransitionReady(false);

    const from = playlist[current];
    const to = playlist[(current + 1) % playlist.length];

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/dj_transition`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userData.user_uid, 
        channel_id: channel.channel_uid,
        from_artist: from.artist,
        from_title: from.title,
        to_artist: to.artist,
        to_title: to.title,
      })
    });

    djDataRef.current = await res.json();

    setDjTransitionReady(true);
  };

  const playDjHelloOverVideo = async () => {
    if (!djHelloDataRef.current || !userData || !channel) return;

    console.log(userData)
    console.log(channel)

    const res = await fetch(
      `${API_URL}/audio?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=${djHelloDataRef.current.audio_filename}`,
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

    audio.onended = () => {
    };
  };

  const prepareDjHello = async (playlistArray) => {
    const to = playlistArray[current]; // берем из параметра
    const res = await fetch(`${API_URL}/dj_hello`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userData.user_uid, 
        channel_id: channel.channel_uid,
        from_artist: "",
        from_title: "",
        to_artist: to.artist,
        to_title: to.title,
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

      const remaining = duration - player.getCurrentTime() - 10;

      console.log("Remaining time:", remaining);
      console.log("Current time:", player.getCurrentTime());

      const dj_duration = 15;

      if (djDataRef.current && remaining < dj_duration) {
        console.log("Starting DJ transition, remaining:", remaining);
        clearInterval(interval);
        playOverlayVideo(`${API_URL}/video?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=default_video.mp4`);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => smoothNext((djDataRef.current.duration - dj_duration) * 1000), (dj_duration) * 1000);
        playDjOverVideo();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [current, playerReady, djTransitionReady]);

  const playDjOverVideo = async () => {
    if (!djDataRef.current || !playerRef.current) return;

    const res = await fetch(
      `${API_URL}/audio?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=${djDataRef.current.audio_filename}`,
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
    if (current === playlist.length - 1 || current === playlist.length - 2 || current === playlist.length - 3) {
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

    }, 50);
  };
  
  const loadPlaylist = async (maxResults = 3) => {
    if (!channel || !token || !userData) return;
    setPlaylistLoading(true);

    try {
      const res = await fetch(`${API_URL}/playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userData.user_uid,
          channel_id: channel.channel_uid,
          max_results: maxResults,
        }),
      });

      const data = await res.json();
      setPlaylist(prev => [...prev, ...data.playlist]);
      setPlaylistReady(true);
      console.log("Playlist loaded:", data.playlist);
    } catch (err) {
      console.error("Failed to load playlist:", err);
    } finally {
      setPlaylistLoading(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  
  const startStreaming = async () => {
    loadPlaylist();
    setIsStreaming(true);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",  // центрируем по горизонтали
        // marginBottom: isFullscreen ? 0 : 20,
        width: "100%",
        display: "flex",
        flexDirection: "column", // вот это делает вертикальный стэк
        alignItems: "center",    // центрируем все элементы по горизонтали
        cursor: isFullscreen ? "none" : "default",
        // gap: isFullscreen ? 0 : 20,             // опционально, чтобы добавить расстояние между элементами
      }}
    >
      {!isStreaming && (
        <AppButton
          onClick={startStreaming}
          // disabled={loading} // неактивна во время загрузки
        >
          {/* {loading ? "Loading..." : "Start DJ Streaming"} */}
          Start DJ Streaming
        </AppButton>
      )}

      
      <div
        style={{
          width: "100%",
          minHeight: 400,           // минимальная высота 400px
          // padding: isFullscreen ? 0 : 16,
          background: "rgba(0,0,0,0.5)",
          borderRadius: 12,
          // marginBottom: isFullscreen ? 0 : 20,
          color: "#fff",
          // overflowX: "hidden",
          transition: "3s opacity",
          cursor: isFullscreen ? "none" : "default",

          position: "relative",      // для абсолютного позиционирования кнопки
          display: "flex",
          justifyContent: "center",  // горизонтальное центрирование текста
          alignItems: "center",      // вертикальное центрирование текста
          fontSize: "24px",
          textAlign: "center",
        }}
      >
        {isStreaming && (playlist.length == 0 || !helloReady || !helloFinished) && (
            <div 
              style={{
                opacity: !helloFinishedTransition ? 1 : 0,
                transition: "3s opacity",
              }}
            >{!helloReady ? "Loading..." : "Hello! We are starting..."}</div>
        )}
      
        {/* Основной контент — 75% ширины */}
        {isStreaming && playlist.length > 0 && helloReady && helloFinished && (
          <div
            style={{
              flexGrow: 1,
              width: "100%",
              height: "100%",
              // maxHeight: isFullscreen ? "100vh" : "60%",
              color: "#fff",
              // backgroundColor:  "#fff",
              textAlign: "center",
              // padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: isFullscreen ? "none" : "default",
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
                <AppButton               
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
                  </AppButton>
              </div>
            )}
          </div>
        )}

        {/* Fullscreen кнопка справа сверху */}
        {!isFullscreen && isStreaming && (
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <FullscreenButton />
          </div>
        )}
      </div>
      
      {!isFullscreen && (
        <Playlist channel={channel} token={token} userData={userData} playlist={playlist} loading={playlistLoading} onLoadPlaylist={loadPlaylist} />
      )}
    </div>
  );
}
