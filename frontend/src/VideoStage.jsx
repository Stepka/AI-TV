import React, { useEffect, useState } from "react";
import TitlesOverlay from "./TitlesOverlay";

export default function VideoStage({
  isTransitioning,
  overlaySrc,
  overlayRef,
  overlayVisible,
  titles,
  isFullscreen,
}) {
  return (
    <div
      style={{
        position: "relative",
        width: isFullscreen ? "100vw" : "95%",  // почти весь контейнер
        aspectRatio: "16 / 9",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#000",
        transition: "width 0.3s",
      }}
    >

      {/* YouTube */}
      <div
        id="player"
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

      <TitlesOverlay
        topTitle={titles.topTitle}
        topSub={titles.topSub}
        nowPlaying={titles.nowPlaying}
        nextTrack={titles.nextTrack}
        zIndex={60}
      />
    </div>
  );
}
