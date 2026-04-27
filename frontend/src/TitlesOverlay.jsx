import React from "react";

export default function TitlesOverlay({
  topTitle = "Channel",
  nowPlaying = "Now playing",
  nextTrack = "Next track",
  zIndex = 999,
}) {
  const singleLineText = (fontSize, fontWeight, lineHeight, opacity = 1) => ({
    color: "#fff",
    fontFamily: "Inter, Arial, sans-serif",
    fontSize,
    fontWeight,
    lineHeight,
    opacity,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "left",
    width: "100%",
  });

  const textLayer = {
    position: "absolute",
    left: "5.7%",
    right: "5.7%",
    pointerEvents: "none",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <path
          fill="#000"
          fillOpacity="1"
          d="
            M 0 0
            L 1920 0
            L 1920 220
            C 1440 180, 960 250, 0 250
            Z
          "
        />

        <path
          fill="#000"
          fillOpacity="1"
          d="
            M 0 1080
            L 1920 1080
            L 1920 850
            C 1600 980, 960 800, 0 850
            Z
          "
        />
      </svg>

      <div style={{ ...textLayer, top: "10.4%" }}>
        <div style={singleLineText(15, 800, "21px")}>
          {topTitle}
        </div>
      </div>

      <div style={{ ...textLayer, bottom: "8.3%" }}>
        <div style={singleLineText(20, 900, "25px")}>
          {nowPlaying}
        </div>
        <div style={singleLineText(11, 700, "16px", 0.5)}>
          Далее: {nextTrack}
        </div>
      </div>
    </div>
  );
}
