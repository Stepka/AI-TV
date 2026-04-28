import { useEffect, useRef, useState } from "react";
import AppButton from "./AppButton";

export default function AIAudioLibrary({ token, userData, channel }) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [files, setFiles] = useState([]);
  const audioRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [brandedTrack, setBrandedTrack] = useState(false);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    if (!channel || !token || !userData) return;
    loadAILibrary();
  }, [userData, channel, token]);

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
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Generate ai track failed");
      }

      if (data.track === "error") {
        const failedMessage = data.type === "FAILED"
          ? "Song generation failed. Please try another style or prompt."
          : "Generate ai track failed";
        throw new Error(data.error || failedMessage);
      }

      setShowGeneratePopup(false);
      loadAILibrary();
    } catch (error) {
      setGenerateError(error.message || "Generate ai track failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteAudio = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this track?")) return;

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
        alert("Error: " + err.detail);
        return;
      }

      loadAILibrary();
    } catch (e) {
      console.error(e);
      alert("Failed to delete audio");
    }
  };

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20, maxHeight: "400px" }}>
      <h2>Audio Library</h2>
      <span>Available generations: {userData?.ai_tracks_num}</span>

      {generateError && !showGeneratePopup && (
        <div style={{ color: "#ff705e" }}>{generateError}</div>
      )}

      <AppButton
        onClick={() => {
          setGenerateError("");
          setShowGeneratePopup(true);
        }}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate track"}
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
            <h3 style={{ margin: 0, color: "#fff" }}>Generate Track</h3>
            {generateError && (
              <div style={{ color: "#ff705e", lineHeight: 1.4 }}>
                {generateError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "rgba(255,255,255,0.72)", fontSize: 14 }}>Music style</label>
              <input
                value={channel?.style || ""}
                readOnly
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={brandedTrack}
                onChange={(e) => setBrandedTrack(e.target.checked)}
              />
              <span>Branded track</span>
            </label>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <AppButton
                onClick={() => {
                  if (isGenerating) return;
                  setShowGeneratePopup(false);
                }}
                disabled={isGenerating}
              >
                Cancel
              </AppButton>
              <AppButton onClick={generate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate"}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {files.map((file) => (
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
                  Play
                </AppButton>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
                <span>{file.name}</span>
                <span style={{ fontSize: 12, opacity: 0.4 }}>
                  Style: {file.style || "Unknown"} | Duration: {formatDuration(file.duration)} | {file.branded_track ? "Branded" : "Not Branded"}
                </span>
              </div>
              <div style={{ flex: "0 0 auto" }}>
                <AppButton onClick={() => handleDeleteAudio(file.filename)}>
                  Delete
                </AppButton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <audio ref={audioRef} controls style={{ width: "100%" }} />
    </div>
  );
}
