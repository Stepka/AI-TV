import React from "react";
import { useI18n } from "./i18n";

export default function StreamControls({
  canUseAdVoice,
  aiDjEnabled,
  adVoiceEnabled,
  brandedTracksEnabled,
  onAiDjChange,
  onAdVoiceChange,
  onBrandedTracksChange,
}) {
  const { t } = useI18n();

  return (
    <div className="stream-controls">
      <label className="stream-option" title={t("stage.enableAiDjDescription")}>
        <input
          className="stream-option-input"
          type="checkbox"
          checked={aiDjEnabled}
          onChange={(event) => onAiDjChange(event.target.checked)}
        />
        <span className="stream-option-check" aria-hidden="true" />
        <span>{t("stage.enableAiDj")}</span>
      </label>

      {canUseAdVoice && (
        <label
          className={`stream-option ${!aiDjEnabled ? "disabled" : ""}`}
          title={t("stage.enableAdsDescription")}
        >
          <input
            className="stream-option-input"
            type="checkbox"
            checked={adVoiceEnabled}
            onChange={(event) => onAdVoiceChange(event.target.checked)}
            disabled={!aiDjEnabled}
          />
          <span className="stream-option-check" aria-hidden="true" />
          <span>{t("stage.enableAds")}</span>
        </label>
      )}

      <label className="stream-option" title={t("stage.brandedTracksDescription")}>
        <input
          className="stream-option-input"
          type="checkbox"
          checked={brandedTracksEnabled}
          onChange={(event) => onBrandedTracksChange(event.target.checked)}
        />
        <span className="stream-option-check" aria-hidden="true" />
        <span>{t("stage.brandedTracks")}</span>
      </label>
    </div>
  );
}
