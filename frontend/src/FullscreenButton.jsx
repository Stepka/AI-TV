import { useState } from "react";
import AppButton from "./AppButton";
import { useI18n } from "./i18n";

export default function FullscreenButton() {
  const { t } = useI18n();
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
      console.log(t("fullscreen.error"), e);
    }
  };

  return (
    <AppButton
      onClick={toggleFullscreen}
    >
      {isFs ? t("fullscreen.exit") : t("fullscreen.enter")}
    </AppButton>
  );
}
