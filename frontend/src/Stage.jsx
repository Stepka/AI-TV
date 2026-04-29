import React, { useState, useEffect, useRef } from "react";
import Playlist from "./Playlist";
import StreamControls from "./StreamControls";
import StageViewport from "./StageViewport";
import TrackPlayerController from "./TrackPlayerController";
import { useI18n } from "./i18n";
import "./global.css";

export default function Stage({ token, userData, channel }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useI18n();
  const canUseAdVoice = true;

  const [isStreaming, setIsStreaming] = useState(false);

  const [playlist, setPlaylist] = useState([]);
  const playlistRef = useRef(playlist);
  const [current, setCurrent] = useState(0);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [brandedTracksEnabled, setBrandedTracksEnabled] = useState(true);
  const [aiDjEnabled, setAiDjEnabled] = useState(true);
  const [adVoiceEnabled, setAdVoiceEnabled] = useState(true);

  const [playerReady, setPlayerReady] = useState(false);
  const [playerRefreshKey, setPlayerRefreshKey] = useState(0);

  const [videoId, setVideoId] = useState(null);
  const [videoSource, setVideoSource] = useState(null);

  const [isTransitioning, setIsTransitioning] = useState(true);
  const [helloReady, setHelloReady] = useState(false);
  const [helloFinished, setHelloFinished] = useState(false);
  const [helloFinishedTransition, setHelloFinishedTransition] = useState(false);

  const [djTransitionReady, setDjTransitionReady] = useState(false);

  const djAudioRef = useRef(null);
  const djDataRef = useRef(null);
  const djHelloDataRef = useRef(null);
  const duckIntervalRef = useRef(null);

  const playerRef = useRef(null);

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
    if (!channel || !userData || !isStreaming || playlist.length === 0 || helloReady) return;

    const scheduledTimeouts = [];
    const helloTimeout = setTimeout(async () => {
      const helloData = await prepareDjHello(playlist);
      playDjHelloOverVideo();

      scheduledTimeouts.push(
        setTimeout(() => {
          console.log("Hello finished");
          setHelloFinished(true);
        }, Math.max(0, helloData.duration * 1000 - 7000)),
        setTimeout(() => {
          console.log("Hello finished transition");
          setHelloFinishedTransition(true);
          setIsTransitioning(false);
        }, Math.max(0, helloData.duration * 1000 - 10000)),
      );

      setHelloReady(true);
    }, 3000);

    return () => {
      clearTimeout(helloTimeout);
      scheduledTimeouts.forEach(clearTimeout);
    };
  }, [channel, userData, isStreaming, playlist.length, helloReady]);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    const currentTrack = playlist[current];
    if (!currentTrack || !channel) return;

    const nextTrack = playlist[(current + 1) % playlist.length] || currentTrack;
    setTitles({
      topTitle: channel?.name ?? t("stage.untitled"),
      topSub: channel?.description ?? "",
      nowPlaying: decodeTrackTitle(currentTrack),
      nextTrack: decodeTrackTitle(nextTrack),
    });
  }, [playlist, current, channel, t]);

  useEffect(() => {
    console.log("Playlist Length:", playlist.length);
    console.log("Hello Finished:", helloFinished);
    console.log("Channel:", channel);
    console.log("Is Streaming:", isStreaming);
    if (!aiDjEnabled) {
      setDjTransitionReady(false);
      return;
    }

    if (!playlist.length || !helloFinished || !channel || !isStreaming) return;

    prepareDjTransition();
  }, [current, helloFinished, isStreaming, aiDjEnabled]);

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
      }),
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

    audio.currentTime = 0;
    audio.volume = 1;
    audio.load();

    await audio.play();

    audio.onended = () => {
      URL.revokeObjectURL(url);
    };
  };

  const prepareDjHello = async (playlistArray) => {
    const to = playlistArray[current];
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
      }),
    });
    const data = await res.json();
    djHelloDataRef.current = data;
    djDataRef.current = data;

    setDjTransitionReady(true);

    return data;
  };

  const startTransition = async (djDuration) => {
    if (!aiDjEnabled) {
      smoothNext(2000);
      return;
    }

    const videoFile = await getRandomVideo();
    playOverlayVideo(`${API_URL}/media/video?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=${videoFile}`);
    smoothNext((djDataRef.current.duration - djDuration) * 1000);
    playDjOverVideo();
  };

  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    if (aiDjEnabled && !djTransitionReady) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player?.getDuration) return;

      const duration = Math.min(player.getDuration(), 600);
      const remaining = duration - player.getCurrentTime() - 10;

      if (!aiDjEnabled) {
        if (remaining < 2) {
          clearInterval(interval);
          fadeTrackVolume({ durationMs: 2000, targetProgress: 1 });
          smoothNext(2000);
        }
        return;
      }

      if (!djDataRef.current) return;
      const djDuration = Math.min(Math.ceil(djDataRef.current.duration / 2), 15);
      if (djDataRef.current && remaining < djDuration) {
        clearInterval(interval);
        startTransition(djDuration);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [current, playerReady, djTransitionReady, aiDjEnabled]);

  const playDjOverVideo = async () => {
    if (!aiDjEnabled || !djDataRef.current || !playerRef.current) return;

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
    audio.onended = () => URL.revokeObjectURL(url);
    audio.play();

    const djDuration = Math.min(Math.ceil(djDataRef.current.duration / 2), 15);
    fadeTrackVolume({
      durationMs: djDuration * 1000,
      targetProgress: 0.5,
    });
  };

  const fadeTrackVolume = ({ durationMs, targetProgress = 1 }) => {
    const period = 50;
    let elapsed = 0;

    clearInterval(duckIntervalRef.current);
    duckIntervalRef.current = setInterval(() => {
      elapsed += period;

      let progress = elapsed / durationMs;
      if (progress >= targetProgress) {
        progress = targetProgress;
        clearInterval(duckIntervalRef.current);
      }

      const baseVolume = videoSource === "youtube" ? 0.75 * 90 : 0.75;
      playerRef.current?.setVolume((1 - progress) * baseVolume);
    }, period);
  };

  const getRandomVideo = async () => {
    const res = await fetch(
      `${API_URL}/media/random_video?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    return data.filename;
  };

  const smoothNext = (timeout = 2000) => {
    setIsTransitioning(true);
    handleNext(timeout);
    setTimeout(() => setIsTransitioning(false), timeout);
  };

  const handleNext = (timeout = 0) => {
    const list = playlistRef.current;

    if (current >= list.length - 3) {
      loadPlaylist();
    }

    setTimeout(() => {
      if (current === 0 && list.length === 1) {
        setPlayerRefreshKey((prev) => prev + 1);
      } else {
        setCurrent((prev) => (prev + 1) % list.length);
      }
    }, timeout);
  };

  const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const decodeTrackTitle = (track) => decodeHtml(`${track.artist} - ${track.title}`);

  const playOverlayVideo = async (src) => {
    setOverlaySrc(src);

    setTimeout(async () => {
      const videoEl = overlayRef.current;
      if (!videoEl) return;

      try {
        videoEl.currentTime = 0;
        await videoEl.play();
      } catch (error) {
        console.warn("overlay play blocked:", error);
      }

      setOverlayVisible(true);

      let stopTime = djDataRef.current.duration - 3;
      if (stopTime < 25) stopTime = 25;
      let totalPlayed = 0;

      const stopOverlay = () => {
        videoEl.removeEventListener("timeupdate", onTimeUpdate);
        setOverlayVisible(false);
        setTimeout(() => {
          videoEl.pause();
          setOverlaySrc(null);
        }, 3000);
      };

      const onTimeUpdate = () => {
        if (videoEl.currentTime + totalPlayed >= stopTime) {
          stopOverlay();
        }
      };

      videoEl.addEventListener("timeupdate", onTimeUpdate);
      videoEl.addEventListener("ended", () => {
        totalPlayed += videoEl.currentTime;
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
    console.log("Starting stream...");
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
