import { useState } from "react";

export default function FullscreenButton() {
  const [isFs, setIsFs] = useState(!!document.fullscreenElement);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFs(true);
      } else {
        await document.exitFullscreen();
        setIsFs(false);
      }
    } catch (e) {
      console.log("Fullscreen error:", e);
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 9999,
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {isFs ? "Exit Fullscreen" : "Fullscreen"}
    </button>
  );
}
