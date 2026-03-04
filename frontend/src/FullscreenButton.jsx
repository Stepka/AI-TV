import { useState } from "react";
import AppButton from "./AppButton";

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
    <AppButton
      onClick={toggleFullscreen}
    >
      {isFs ? "Exit Fullscreen" : "Fullscreen"}
    </AppButton>
  );
}
