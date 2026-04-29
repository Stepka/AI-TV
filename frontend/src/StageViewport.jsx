import React from "react";
import AppButton from "./AppButton";
import FullscreenButton from "./FullscreenButton";
import VideoStage from "./VideoStage";
import { useI18n } from "./i18n";

export default function StageViewport({
  isFullscreen,
  isStreaming,
  playlist,
  helloReady,
  helloFinished,
  helloFinishedTransition,
  isTransitioning,
  overlaySrc,
  overlayRef,
  overlayVisible,
  titles,
  videoId,
  videoSource,
  onStartStreaming,
  onNext,
}) {
  const { t } = useI18n();
  const isPreparingStream = isStreaming && (playlist.length === 0 || !helloReady || !helloFinished);
  const isPlaying = isStreaming && playlist.length > 0 && helloReady && helloFinished;

  return (
    <div
      className="stage-viewport"
      style={{
        cursor: isFullscreen ? "none" : "default",
      }}
    >
      {!isStreaming && (
        <AppButton onClick={onStartStreaming}>
          {t("stage.startStreaming")}
        </AppButton>
      )}

      {isPreparingStream && (
        <div
          style={{
            opacity: !helloFinishedTransition ? 1 : 0,
            transition: "3s opacity",
          }}
        >
          {!helloReady ? t("common.loading") : t("stage.starting")}
        </div>
      )}

      {isPlaying && (
        <div
          className="stage-playback"
          style={{
            cursor: isFullscreen ? "none" : "default",
          }}
        >
          <VideoStage
            isTransitioning={isTransitioning}
            overlaySrc={overlaySrc}
            overlayRef={overlayRef}
            overlayVisible={overlayVisible}
            titles={titles}
            isFullscreen={isFullscreen}
            videoId={videoId}
            videoSource={videoSource}
          />

          {!isFullscreen && (
            <div className="stage-actions">
              <AppButton
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={onNext}
              >
                {t("stage.next")}
              </AppButton>
            </div>
          )}
        </div>
      )}

      {!isFullscreen && isStreaming && (
        <div className="stage-fullscreen-button">
          <FullscreenButton />
        </div>
      )}
    </div>
  );
}
