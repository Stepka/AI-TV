import React, { useMemo } from "react";
import { useI18n } from "./i18n";

export default function Playlist({ channel, playlist, loading, brandedTracksEnabled }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useI18n();

  const formatDuration = (value) => {
    const totalSeconds = Math.max(0, Math.round(value || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const visiblePlaylist = useMemo(() => {
    if (!playlist?.length) return [];

    return playlist.filter((item) => {
      if (!brandedTracksEnabled && item?.branded_track) {
        return false;
      }
      return true;
    });
  }, [playlist, brandedTracksEnabled]);

  return (
    <div style={{ width: "100%", marginTop: 20, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {visiblePlaylist.map((item, index) => {
          const styleText = item.style || channel?.style || t("common.unknown");

          return (
            <div
              key={`${item.videoId || item.title || "track"}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.22)",
              }}
            >
              {item.image_url && (
                <img
                  src={`${API_URL}/${item.image_url}`}
                  alt={item.display_name || `${item.artist} - ${item.title}`}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 8,
                    flex: "0 0 64px",
                  }}
                />
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
                <span>{item.display_name || `${item.artist} - ${item.title}`}</span>
                <span className="track-meta">
                  <span className="track-style-meta" title={styleText}>
                    {t("playlist.style")}: {styleText}
                  </span>
                  <span>|</span>
                  <span>{t("playlist.duration")}: {item.duration > 0 ? formatDuration(item.duration) : t("common.unknown")}</span>
                  <span>|</span>
                  <span>{item.branded_track ? t("playlist.branded") : t("playlist.notBranded")}</span>
                </span>
              </div>
            </div>
          );
        })}

        {!loading && visiblePlaylist.length === 0 && (
          <div style={{ opacity: 0.7 }}>{t("playlist.empty")}</div>
        )}
      </div>
    </div>
  );
}
