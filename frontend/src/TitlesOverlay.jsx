import React from "react";
import { useI18n } from "./i18n";

export default function TitlesOverlay({
  topTitle,
  nowPlaying,
  nextTrack,
  zIndex = 999,
}) {
  const { t } = useI18n();
  const resolvedTopTitle = topTitle || t("titles.channel");
  const resolvedNowPlaying = nowPlaying || t("titles.nowPlaying");
  const resolvedNextTrack = nextTrack || t("titles.nextTrack");
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
          {resolvedTopTitle}
        </div>
      </div>

      <div style={{ ...textLayer, bottom: "8.3%" }}>
        <div style={singleLineText(20, 900, "25px")}>
          {resolvedNowPlaying}
        </div>
        <div style={singleLineText(11, 700, "16px", 0.5)}>
          {t("titles.next", { track: resolvedNextTrack })}
        </div>
      </div>
    </div>
  );
}
