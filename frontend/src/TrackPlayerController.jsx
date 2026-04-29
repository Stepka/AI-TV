import { useEffect } from "react";
import AIAudioPlayer from "./AIAudioPlayer";

let externalPlayerApisLoaded = false;

function loadExternalPlayerApis() {
  if (externalPlayerApisLoaded) return;

  const youtubeScript = document.createElement("script");
  youtubeScript.src = "https://www.youtube.com/iframe_api";
  document.body.appendChild(youtubeScript);

  const vkScript = document.createElement("script");
  vkScript.src = "https://vk.com/js/api/videoplayer.js";
  vkScript.async = true;
  document.body.appendChild(vkScript);

  externalPlayerApisLoaded = true;
}

function rampPlayerVolume(player, source, duckIntervalRef) {
  const duration = 10000;
  const period = 50;
  let elapsed = 0;

  clearInterval(duckIntervalRef.current);
  duckIntervalRef.current = setInterval(() => {
    elapsed += period;

    let progress = elapsed / duration;
    if (progress >= 1) {
      progress = 1;
      clearInterval(duckIntervalRef.current);
    }

    const volume = source === "youtube"
      ? Math.pow(progress, 2) * 0.75 * 90
      : Math.pow(progress, 2) * 0.75;

    player.setVolume(volume);
  }, period);
}

function waitForElement(selector, onFound, isReady = () => true) {
  const interval = setInterval(() => {
    const element = document.querySelector(selector);
    if (!element) return;
    if (!isReady(element)) return;

    clearInterval(interval);
    onFound(element);
  }, 50);

  return () => clearInterval(interval);
}

export default function TrackPlayerController({
  track,
  refreshKey = 0,
  apiUrl,
  userData,
  channel,
  playerRef,
  duckIntervalRef,
  onPlayerReady,
  onVideoIdChange,
  onVideoSourceChange,
  onPlaybackError,
  getRandomVideo,
}) {
  useEffect(() => {
    loadExternalPlayerApis();
  }, []);

  useEffect(() => {
    if (!track || !userData || !channel) {
      if (playerRef.current) {
        playerRef.current.destroy?.();
        playerRef.current = null;
      }
      onPlayerReady(false);
      return undefined;
    }

    if (playerRef.current) {
      playerRef.current.destroy?.();
      playerRef.current = null;
    }

    onPlayerReady(false);
    onVideoIdChange(track.videoId);
    onVideoSourceChange(track.source);

    if (track.source === "youtube") {
      const stopWaiting = waitForElement("#YTPlayer", () => {
        playerRef.current = new window.YT.Player("YTPlayer", {
          height: "405",
          width: "720",
          host: "https://www.youtube.com",
          videoId: track.videoId,
          events: {
            onReady: (event) => {
              event.target.setVolume(0);
              rampPlayerVolume(event.target, "youtube", duckIntervalRef);
              onPlayerReady(true);
            },
          },
          playerVars: {
            autoplay: 1,
            enablejsapi: 1,
            origin: "http://localhost:3030",
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
          },
        });
      }, () => !!window.YT?.Player);

      return () => {
        stopWaiting();
        playerRef.current?.destroy?.();
        playerRef.current = null;
      };
    }

    if (track.source === "vk") {
      const stopWaiting = waitForElement("#vkplayer", () => {
        playerRef.current = new window.VK.VideoPlayer(document.querySelector("#vkplayer"));

        playerRef.current.on("inited", () => {
          onPlayerReady(true);
          playerRef.current.setVolume(0);
          playerRef.current.play();
          rampPlayerVolume(playerRef.current, "vk", duckIntervalRef);
        });

        playerRef.current.on("adStarted", () => console.log("video adStarted"));
        playerRef.current.on("adCompleted", () => console.log("video adCompleted"));
        playerRef.current.on("started", () => console.log("video started"));
        playerRef.current.on("error", () => {
          console.log("video error");
          console.log(playerRef.current.getState());
          console.log(playerRef.current.getErrorCode());
          onPlaybackError();
        });
        playerRef.current.on("ended", () => {
          playerRef.current.pause();
        });

        onPlayerReady(false);
      }, () => !!window.VK?.VideoPlayer);

      return () => {
        stopWaiting();
        playerRef.current?.destroy?.();
        playerRef.current = null;
      };
    }

    if (track.source === "ai_audio") {
      const stopWaiting = waitForElement("#ai_audio_player", async () => {
        const videoFile = await getRandomVideo();
        playerRef.current = new AIAudioPlayer("ai_audio_player", {
          src: `${apiUrl}/${track.videoId}`,
          videoSrc: `${apiUrl}/media/video?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=${videoFile}`,
        });

        playerRef.current.setVolume(0);
        rampPlayerVolume(playerRef.current, "ai_audio", duckIntervalRef);
        playerRef.current.play();
        playerRef.current.onEnded(() => playerRef.current.destroy());
        onPlayerReady(true);
      });

      return () => {
        stopWaiting();
        playerRef.current?.destroy?.();
        playerRef.current = null;
      };
    }

    return undefined;
  }, [track?.source, track?.videoId, refreshKey, apiUrl, userData?.user_uid, channel?.channel_uid]);

  return null;
}
