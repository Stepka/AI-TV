import { useEffect, useState, useRef } from "react";
import AppButton from "./AppButton";

export default function AIAudioLibrary({ token, userData, channel }) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [files, setFiles] = useState([]);
  const audioRef = useRef(null);
  
  const [isGenerating, setIsGenerating] = useState(false);

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
      .then(res => res.json())
      .then(data => setFiles(data.files));
  };

  const playAudio = (url) => {
    if (audioRef.current) {
      url = `${API_URL}/${url}`
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  const generate = async () => {
    setIsGenerating(true);
    const res = await fetch(`${API_URL}/media/generate_ai_track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userData.user_uid, 
        channel_id: channel.channel_uid
      })
    })
    setIsGenerating(false);

    if (!res.ok) throw new Error("Generate ai track failed");

    loadAILibrary();
  };

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
    <h2>🎧 Audio Library</h2>

    <AppButton onClick={() => generate()} disabled={isGenerating}>
        {isGenerating ? "Generating..." : "🎵 Generate track"}
    </AppButton>

    <ul style={{ listStyle: "none", padding: 0 }}>
        {files.map((file, idx) => (
        <li key={idx} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AppButton onClick={() => playAudio(file.url)}>
                ▶ Play
            </AppButton>
            <span>{file.name}</span>
            </div>
        </li>
        ))}
    </ul>

    <audio ref={audioRef} controls style={{ width: "100%" }} />
    </div>
  );
}