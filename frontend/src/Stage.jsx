import React, { useState, useEffect, useRef } from "react";
import Playlist from "./Playlist";
import StreamControls from "./StreamControls";
import StageViewport from "./StageViewport";
import TrackPlayerController from "./TrackPlayerController";
import { useI18n } from "./i18n";
import './global.css';



export default function Stage({ token, userData, channel }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useI18n();
  const canUseAdVoice = true;
  
  const [isStreaming, setIsStreaming] = useState(false);

  const [playlist, setPlaylist] = useState([]);
  const playlistRef = useRef(playlist);
  const [current, setCurrent] = useState(0);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistReady, setPlaylistReady] = useState(false);  
  const [brandedTracksEnabled, setBrandedTracksEnabled] = useState(true);
  const [aiDjEnabled, setAiDjEnabled] = useState(true);
  const [adVoiceEnabled, setAdVoiceEnabled] = useState(true);
  
  const [playerReady, setPlayerReady] = useState(false);
  const [playerRefreshKey, setPlayerRefreshKey] = useState(0);

  const [videoId, setVideoId] = useState(null);
  const [videoSource, setVideoSource] = useState(null);

  const [isTransitioning, setIsTransitioning] = useState(true); // fade
  // const [isBlackout, setIsBlackout] = useState(true);           // чёрный экран
  const [helloReady, setHelloReady] = useState(false);
  const [helloFinished, setHelloFinished] = useState(false);
  const [helloFinishedTransition, setHelloFinishedTransition] = useState(false);
  
  const [djTransitionReady, setDjTransitionReady] = useState(false);

  const djAudioRef = useRef(null);
  const djDataRef = useRef(null);
  const djHelloDataRef = useRef(null);
  const duckIntervalRef = useRef(null);
  const trackTimeoutInterval = useRef(null);

  const playerRef = useRef(null);
  const timeoutRef = useRef(null);
  
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
    if (!aiDjEnabled) {
      setAdVoiceEnabled(false);
      setDjTransitionReady(false);
      djDataRef.current = null;
      return;
    }

    if (!canUseAdVoice) {
      setAdVoiceEnabled(false);
      return;
    }

    setAdVoiceEnabled(true);
  }, [aiDjEnabled, canUseAdVoice]);

  useEffect(() => {
    if (!channel || !userData || !isStreaming || playlist.length === 0) return; // только если пользователь залогинен и канал выбран

    const fadeOutTimeout = setTimeout(async () => {

      const helloData = await prepareDjHello(playlist);

      // console.log("Hello data:", helloData);

      playDjHelloOverVideo();

      const fadeInTimeout = setTimeout(() => {
        // setIsBlackout(false);
      }, helloData.duration * 1000 - 6900); // плавный fade-in

      const helloFinishedTimeout = setTimeout(() => {
        setHelloFinished(true);
      }, helloData.duration * 1000 - 7000); // плавный fade-in

      const helloFinishedTransitionTimeout = setTimeout(() => {
        setHelloFinishedTransition(true);
        setIsTransitioning(false);
      }, helloData.duration * 1000 - 10000); // плавный fade-in

      setHelloReady(true)
    }, 3000); // плавный fade-out

    return () => {
      clearTimeout(fadeOutTimeout);
    };
  }, [isStreaming, playlistReady]);

  useEffect(() => {
    if (!playlist.length || !helloFinished || !channel || !isStreaming) return;

    const currentVideoTitle = decodeHtml(playlist[current].artist + " - " + playlist[current].title);
    const nextIndex = (current + 1) % playlist.length;
    const nextVideoTitle = decodeHtml(playlist[nextIndex].artist + " - " + playlist[nextIndex].title);
    setTitles({
      topTitle: channel?.name ?? t("stage.untitled"),
      topSub: channel?.description ?? "",
      nowPlaying: currentVideoTitle ?? "",
      nextTrack: nextVideoTitle ?? "",
    });

    // заранее готовим DJ
  }, [current, helloFinished, isStreaming]);

  useEffect(() => {
    if (!aiDjEnabled) {
      setDjTransitionReady(false);
      return;
    }

    if (!playlist.length || !helloFinished || !channel || !isStreaming) return;

    prepareDjTransition();
  }, [current, helloFinished, isStreaming, aiDjEnabled]);


  useEffect(() => {
    if (!playlist.length ) return;

    // console.log("Updating titles for current and next video");
    // console.log(playlist);
    playlistRef.current = playlist;

    const currentVideoTitle = decodeHtml(playlist[current].artist + " - " + playlist[current].title);
    const nextIndex = (current + 1) % playlist.length;
    const nextVideoTitle = decodeHtml(playlist[nextIndex].artist + " - " + playlist[nextIndex].title);
    setTitles({
      topTitle: channel?.name ?? t("stage.untitled"),
      topSub: channel?.description ?? "",
      nowPlaying: currentVideoTitle ?? "",
      nextTrack: nextVideoTitle ?? "",
    });

  }, [playlist]);

  const prepareDjTransition = async () => {
    if (!aiDjEnabled) return;

    setDjTransitionReady(false);

    const from = playlist[current];
    const to = playlist[(current + 1) % playlist.length];

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/dj/transition`, {
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

    const res = await fetch(
      `${API_URL}/media/speech?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=${djHelloDataRef.current.audio_filename}&type=${djHelloDataRef.current.type}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error(t("phrases.audioFetchFailed"));

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    djAudioRef.current = audio;

    // важное: сброс позиции
    audio.currentTime = 0;
    audio.volume = 0.5;
    // const interval = setInterval(() => {
    //   if (audio) {
    //     console.log("Current time:", audio.currentTime.toFixed(2));
    //     console.log("Current volume:", audio.volume.toFixed(2));
    //   }
    // }, 500);

    audio.load();
    // console.log("Current time:", audio.currentTime.toFixed(2));
    // console.log("Current volume:", audio.volume.toFixed(2));
    
    // await wait(3000);

    // audio.pause();

    // await wait(3000);

    audio.currentTime = 0;
    audio.volume = 1;

    await audio.play();
    // console.log("Current time:", audio.currentTime.toFixed(2));
    // console.log("Current volume:", audio.volume.toFixed(2));

    audio.onended = () => {
      // тут можно cleanup
      URL.revokeObjectURL(url); // чтобы не было утечки памяти
    };
  };
  
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const prepareDjHello = async (playlistArray) => {
    const to = playlistArray[current]; // берем из параметра
    const res = await fetch(`${API_URL}/dj/hello`, {
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
  
  const startTransition = async (dj_duration) => {  
    if (!aiDjEnabled) {
      smoothNext(2000);
      return;
    }

    // console.log("startTransition")
    clearInterval(trackTimeoutInterval);
    
    const videofile = await getRandomVideo();
    playOverlayVideo(`${API_URL}/media/video?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=${videofile}`);

    clearTimeout(timeoutRef.current);
    // console.log("start transition:", dj_duration, djDataRef.current.duration)
    // timeoutRef.current = setTimeout(() => smoothNext((djDataRef.current.duration - dj_duration) * 1000), (dj_duration) * 1000);
    smoothNext((djDataRef.current.duration - dj_duration) * 1000)
    playDjOverVideo();
  };

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    if (aiDjEnabled && !djTransitionReady) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getDuration) return;

      let duration = player.getDuration();
      if (duration > 600) duration = 600;
      duration = duration; // отрубаем 30 секунд в конце для плавного перехода

      const remaining = duration - player.getCurrentTime() - 10;

      // console.log("Remaining time:", remaining);
      // console.log("Current time:", player.getCurrentTime());


      if (!aiDjEnabled) {
        if (remaining < 2) {
          clearInterval(interval);
          smoothNext(2000);
        }
        return;
      }

      // const dj_duration = 15;
      let dj_duration = djDataRef.current.duration / 2;
      if (dj_duration > 15) dj_duration = 15;
      // console.log("Checking DJ transition:", djDataRef.current);
      if (djDataRef.current && remaining < dj_duration) {
        // console.log("Starting DJ transition, remaining:", remaining);
        clearInterval(interval);

        startTransition(dj_duration);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [current, playerReady, djTransitionReady, aiDjEnabled]);

  const playDjOverVideo = async () => {
    if (!aiDjEnabled) return;
    if (!djDataRef.current || !playerRef.current) return;
    // if (!djDataRef.current) return;

    const res = await fetch(
      `${API_URL}/media/speech?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=${djDataRef.current.audio_filename}&type=${djDataRef.current.type}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error(t("phrases.audioFetchFailed"));

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    djAudioRef.current = audio;

    audio.volume = 1;
    audio.onended = () => {
      // console.log("dj ended")
      // handleNext();
    };
    audio.play();

    // const dj_duration = 15;
    let dj_duration = djDataRef.current.duration / 2;
    if (dj_duration > 15) dj_duration = 15;
    const durationMs = (dj_duration) * 1000;
    const period = 50; // частота обновления
    let elapsed = 0;

    clearInterval(duckIntervalRef.current);
    duckIntervalRef.current = setInterval(() => {
      elapsed += period;

      let progress = elapsed / durationMs;

      if (progress >= 1) {
        progress = 1;
        clearInterval(duckIntervalRef.current);
      }

      // 🔥 Параболическое затухание
      const volume = videoSource === "youtube" ? Math.pow(1 - progress, 2) * 0.75 * 90 : Math.pow(1 - progress, 2) * 0.75;
      if (playerRef.current) {
        playerRef.current.setVolume(volume);
        // console.log("plDjOvVi Volume:", playerRef.current.getVolume())
      }

    }, period);

    
  };

  const getRandomVideo = async () => {

    const res = await fetch(
      `${API_URL}/media/random_video?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json(); // только один раз

    return data["filename"];
  };

  // Плавный переход клипа через затемнение
  const smoothNext = (timeout = 2000) => {
    // console.log("smoothNext")
    setIsTransitioning(true);

    handleNext(timeout);
    setTimeout(() => {
      setIsTransitioning(false);
    }, timeout);
  };

  // Следующий клип
  const handleNext = (timeout = 0) => {
    const list = playlistRef.current;

    if (current === list.length - 1 || current === list.length - 2 || current === list.length - 3) {
      loadPlaylist();
    }

    // console.log("handleNext called with timeout:", timeout);
    // console.log("current playlist", list);
    // console.log("old playlist", playlist);
    // console.log(current);
    setTimeout(() => {
      if (current == 0 && list.length == 1) {
        setPlayerRefreshKey((prev) => prev + 1);
      } else {
        // console.log("handleNext")
        setCurrent(prev => (prev + 1) % list.length);
      }
    }, timeout);
  };

  // const prevVideo = () => {
  //   setIsTransitioning(true);
  //   setTimeout(() => {
  //     setCurrent(prev => (prev - 1 + playlist.length) % playlist.length);
  //     setIsTransitioning(false);
  //   }, 300);
  // };

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
      if (stopTime < 25) stopTime = 25;
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
      // console.log(videoEl.duration);
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
          branded_tracks_enabled: brandedTracksEnabled,
        }),
      });

      const data = await res.json();
      setPlaylist(prev => [...prev, ...data.playlist]);

      setPlaylistReady(true);
      // console.log("Playlist loaded:", data.playlist);
    } catch (err) {
      console.error(t("stage.failedToLoadPlaylist"), err);
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

  const handleBrandedTracksChange = (enabled) => {
    setBrandedTracksEnabled(enabled);
    if (!enabled) {
      setPlaylist((prev) => {
        const filtered = prev.filter((item) => !item?.branded_track);
        setCurrent((currentIndex) => Math.min(currentIndex, Math.max(filtered.length - 1, 0)));
        return filtered;
      });
    }
  };

  const currentTrack = isStreaming && helloFinished && playlist.length > 0
    ? playlist[current]
    : null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        width: "100%",
        height: "100%",
        minHeight: 0,
        flexDirection: "column",
        alignItems: "center",
        cursor: isFullscreen ? "none" : "default",
        overflowY: isFullscreen ? "hidden" : "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        paddingRight: isFullscreen ? 0 : 6,
      }}
    >
      {!isFullscreen && (
        <StreamControls
          canUseAdVoice={canUseAdVoice}
          aiDjEnabled={aiDjEnabled}
          adVoiceEnabled={adVoiceEnabled}
          brandedTracksEnabled={brandedTracksEnabled}
          onAiDjChange={setAiDjEnabled}
          onAdVoiceChange={setAdVoiceEnabled}
          onBrandedTracksChange={handleBrandedTracksChange}
        />
      )}
      <TrackPlayerController
        track={currentTrack}
        refreshKey={playerRefreshKey}
        apiUrl={API_URL}
        userData={userData}
        channel={channel}
        playerRef={playerRef}
        duckIntervalRef={duckIntervalRef}
        onPlayerReady={setPlayerReady}
        onVideoIdChange={setVideoId}
        onVideoSourceChange={setVideoSource}
        onPlaybackError={smoothNext}
        getRandomVideo={getRandomVideo}
      />
      <StageViewport
        isFullscreen={isFullscreen}
        isStreaming={isStreaming}
        playlist={playlist}
        helloReady={helloReady}
        helloFinished={helloFinished}
        helloFinishedTransition={helloFinishedTransition}
        isTransitioning={isTransitioning}
        overlaySrc={overlaySrc}
        overlayRef={overlayRef}
        overlayVisible={overlayVisible}
        titles={titles}
        videoId={videoId}
        videoSource={videoSource}
        onStartStreaming={startStreaming}
        onNext={smoothNext}
      />
      {!isFullscreen && (
        <Playlist
          channel={channel}
          playlist={playlist}
          loading={playlistLoading}
          brandedTracksEnabled={brandedTracksEnabled}
        />
      )}
    </div>
  );
}
