import React, { useEffect, useState, useRef } from "react";
import TitlesOverlay from "./TitlesOverlay";
import VkVideoPlayer from "./VkVideoPlayer";

export default function VideoStage({
  videoId,
  isTransitioning,
  overlaySrc,
  overlayRef,
  overlayVisible,
  titles,
  isFullscreen,
  videoSource,
}) {

  const oid = videoId ? videoId.split("_")[0] : null;
  const id = videoId ? videoId.split("_")[1] : null;

  return (
    <div
      style={{
        position: "relative",
        width: isFullscreen ? "100vw" : "80%",  // почти весь контейнер
        aspectRatio: "16 / 9",
        borderRadius: "12px",
        overflow: "hidden",
        // backgroundColor: "#f00",
        transition: "width 0.3s",
      }}
    >

      {/* YouTube */}
      {videoSource === "youtube" && (
        <div
          id="YTPlayer"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transition: "2s opacity",
            opacity: isTransitioning ? 0 : 1,
            zIndex: 1,
          }}
        />
      )}

      {/* VK Video */}
      {videoSource === "vk" && (
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transition: "2s opacity",
          opacity: isTransitioning ? 0 : 1,
          zIndex: 1,
        }}>
          <VkVideoPlayer
            oid={oid}
            id={id}
            autoplay={1}
          />
        </div>
      )}

      {/* AI Audio */}
      {videoSource === "ai_audio" && (
        <div
          id="ai_audio_player"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transition: "2s opacity",
            opacity: isTransitioning ? 0 : 1,
            zIndex: 1,
          }}
        />
      )}

      {/* Overlay видео */}
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
            transition: "opacity 3s ease",
            pointerEvents: "none",
          }}
        />
      )}

      {!isFullscreen && (
        <TitlesOverlay
          topTitle={titles.topTitle}
          topSub={titles.topSub}
          nowPlaying={titles.nowPlaying}
          nextTrack={titles.nextTrack}
          zIndex={60}
        />
      )}
    </div>
  );
}
