import { useEffect, useRef, useState } from "react";
import AppButton from "./AppButton";
import { useI18n } from "./i18n";

export default function AIAudioLibrary({ token, userData, channel }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useI18n();

  const [files, setFiles] = useState([]);
  const audioRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [brandedTrack, setBrandedTrack] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [availableGenerations, setAvailableGenerations] = useState(userData?.ai_tracks_num ?? 0);
  const [tracksCount, setTracksCount] = useState(2);
  const [generationJob, setGenerationJob] = useState(null);

  const hasUnlimitedGenerations = availableGenerations === -1;
  const maxTracksCount = hasUnlimitedGenerations
    ? null
    : Math.max(0, Math.floor((availableGenerations || 0) / 2) * 2);
  const canGenerateTracks = availableGenerations === -1 || maxTracksCount >= 2;

  const normalizeTracksCount = (value) => {
    const parsed = Number(value) || 2;
    const evenValue = Math.max(2, parsed - (parsed % 2));
    return hasUnlimitedGenerations ? evenValue : Math.min(evenValue, maxTracksCount || 2);
  };

  useEffect(() => {
    if (!channel || !token || !userData) return;
    loadAILibrary();
    loadActiveGenerationJob();
  }, [userData, channel, token]);

  useEffect(() => {
    if (!generationJob?.job_id || !token) return undefined;
    if (!["queued", "running"].includes(generationJob.status)) return undefined;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/media/generate_ai_track/${generationJob.job_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.detail || t("audioLibrary.generateFailed"));
        }

        const nextJob = data.job;
        setGenerationJob(nextJob);

        if (nextJob.status === "done") {
          clearInterval(interval);
          setIsGenerating(false);
          const refundedTracksCount = nextJob.result?.refunded_tracks_count || 0;
          const generationErrors = nextJob.result?.errors || [];

          if (refundedTracksCount > 0) {
            setAvailableGenerations((current) => current === -1 ? current : current + refundedTracksCount);
          }

          if (generationErrors.length > 0) {
            setGenerateError(t("audioLibrary.generationPartialFailed", {
              count: refundedTracksCount,
            }));
          }

          loadAILibrary();
        }

        if (nextJob.status === "failed") {
          clearInterval(interval);
          setIsGenerating(false);
          const refundedTracksCount = nextJob.requested_tracks_count || 0;

          if (refundedTracksCount > 0) {
            setAvailableGenerations((current) => current === -1 ? current : current + refundedTracksCount);
          }

          setGenerateError(nextJob.error || t("audioLibrary.generateFailed"));
        }
      } catch (error) {
        clearInterval(interval);
        setIsGenerating(false);
        setGenerateError(error.message || t("audioLibrary.generateFailed"));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [generationJob?.job_id, generationJob?.status, token]);

  useEffect(() => {
    setAvailableGenerations(userData?.ai_tracks_num ?? 0);
  }, [userData?.ai_tracks_num]);

  useEffect(() => {
    if (!canGenerateTracks) {
      setTracksCount(2);
      return;
    }

    setTracksCount((current) => normalizeTracksCount(current));
  }, [maxTracksCount, canGenerateTracks]);

  const loadAILibrary = () => {
    if (!channel || !token || !userData) return;

    fetch(`${API_URL}/media/ai_audio_library?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      }
    })
      .then((res) => res.json())
      .then((data) => setFiles(data.files));
  };

  const loadActiveGenerationJob = async () => {
    if (!channel || !token || !userData) return;

    try {
      const res = await fetch(
        `${API_URL}/media/generate_ai_track_active?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}`,
        {
          headers: { "Authorization": `Bearer ${token}` },
        }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.job) return;

      setGenerationJob(data.job);
      setIsGenerating(["queued", "running"].includes(data.job.status));
    } catch (error) {
      console.warn("Failed to load active generation job:", error);
    }
  };

  const formatDuration = (value) => {
    const totalSeconds = Math.max(0, Math.round(value || 0));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const playAudio = (url) => {
    if (audioRef.current) {
      audioRef.current.src = `${API_URL}/${url}`;
      audioRef.current.play();
    }
  };

  const generate = async () => {
    setIsGenerating(true);
    setGenerateError("");

    try {
      const res = await fetch(`${API_URL}/media/generate_ai_track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userData.user_uid,
          channel_id: channel.channel_uid,
          branded_track: brandedTrack,
          tracks_count: tracksCount,
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || data.error || t("audioLibrary.generateFailed"));
      }

      if (data.track === "error") {
        const failedMessage = data.type === "FAILED"
          ? t("audioLibrary.generationFailedHint")
          : t("audioLibrary.generateFailed");
        throw new Error(data.error || failedMessage);
      }

      if (availableGenerations !== -1) {
        setAvailableGenerations((current) => Math.max(0, current - tracksCount));
      }
      setGenerationJob({
        job_id: data.job_id,
        status: data.status || data.track,
        requested_tracks_count: data.requested_tracks_count || tracksCount,
      });
      setShowGeneratePopup(false);
    } catch (error) {
      setGenerateError(error.message || t("audioLibrary.generateFailed"));
      setIsGenerating(false);
    }
  };

  const handleDeleteAudio = async (filename) => {
    if (!window.confirm(t("audioLibrary.confirmDelete"))) return;

    try {
      const res = await fetch(`${API_URL}/media/delete_audio`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userData.user_uid,
          channel_id: channel.channel_uid,
          filename,
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(t("common.errorPrefix", { message: err.detail }));
        return;
      }

      loadAILibrary();
    } catch (e) {
      console.error(e);
      alert(t("audioLibrary.deleteFailed"));
    }
  };

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20, maxHeight: "400px" }}>
      <h2>{t("audioLibrary.title")}</h2>
      <span>
        {t("audioLibrary.availableGenerations", {
          count: hasUnlimitedGenerations ? t("audioLibrary.unlimitedGenerations") : availableGenerations,
        })}
      </span>
      <span>{t("audioLibrary.generatedTracks", { count: files.length })}</span>

      {generateError && !showGeneratePopup && (
        <div style={{ color: "#ff705e" }}>{generateError}</div>
      )}
      {generationJob && ["queued", "running"].includes(generationJob.status) && (
        <div style={{ color: "rgba(255,255,255,0.72)" }}>
          {t("audioLibrary.generationJobStatus", {
            status: t(`audioLibrary.jobStatus.${generationJob.status}`),
            count: generationJob.requested_tracks_count || tracksCount,
          })}
        </div>
      )}

      <AppButton
        onClick={() => {
          setGenerateError("");
          setShowGeneratePopup(true);
        }}
        disabled={isGenerating || !canGenerateTracks}
      >
        {isGenerating ? t("audioLibrary.generating") : t("audioLibrary.generateTrack")}
      </AppButton>

      {showGeneratePopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "#1f1f1f",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
            }}
          >
            <h3 style={{ margin: 0, color: "#fff" }}>{t("audioLibrary.generateTitle")}</h3>
            {generateError && (
              <div style={{ color: "#ff705e", lineHeight: 1.4 }}>
                {generateError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(255,255,255,0.72)", fontSize: 14 }}>{t("audioLibrary.musicStyle")}</label>
              <textarea
                value={channel?.style || ""}
                readOnly
                rows={4}
                style={{
                  minHeight: 92,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  lineHeight: 1.45,
                  resize: "none",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  outline: "none",
                }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={brandedTrack}
                onChange={(e) => setBrandedTrack(e.target.checked)}
              />
              <span>{t("audioLibrary.brandedTrack")}</span>
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(255,255,255,0.72)", fontSize: 14 }}>
                {t("audioLibrary.tracksCount")}
              </label>
              <input
                type="number"
                min={2}
                max={hasUnlimitedGenerations ? undefined : maxTracksCount || 2}
                step={2}
                value={tracksCount}
                disabled={!canGenerateTracks || isGenerating}
                onChange={(event) => setTracksCount(normalizeTracksCount(event.target.value))}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  outline: "none",
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.48)", fontSize: 12 }}>
                {hasUnlimitedGenerations
                  ? t("audioLibrary.tracksCountUnlimitedHint")
                  : t("audioLibrary.tracksCountHint", { count: maxTracksCount || 0 })}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <AppButton
                onClick={() => {
                  if (isGenerating) return;
                  setShowGeneratePopup(false);
                }}
                disabled={isGenerating}
              >
                {t("common.cancel")}
              </AppButton>
              <AppButton onClick={generate} disabled={isGenerating || !canGenerateTracks}>
                {isGenerating ? t("audioLibrary.generating") : t("audioLibrary.generate")}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {files.map((file) => {
          const styleText = file.style || t("common.unknown");

          return (
            <li key={file.track_id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {file.image_url && (
                  <img
                    src={`${API_URL}/${file.image_url}`}
                    alt={file.name}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 8,
                      flex: "0 0 64px",
                    }}
                  />
                )}
                <div style={{ flex: "0 0 auto" }}>
                  <AppButton onClick={() => playAudio(file.url)}>
                    {t("common.play")}
                  </AppButton>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
                  <span>{file.name}</span>
                  <span className="track-meta">
                    <span className="track-style-meta" title={styleText}>
                      {t("playlist.style")}: {styleText}
                    </span>
                    <span>|</span>
                    <span>{t("playlist.duration")}: {formatDuration(file.duration)}</span>
                    <span>|</span>
                    <span>{file.branded_track ? t("playlist.branded") : t("playlist.notBranded")}</span>
                  </span>
                </div>
                <div style={{ flex: "0 0 auto" }}>
                  <AppButton onClick={() => handleDeleteAudio(file.filename)}>
                    {t("common.delete")}
                  </AppButton>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <audio ref={audioRef} controls style={{ width: "100%" }} />
    </div>
  );
}
