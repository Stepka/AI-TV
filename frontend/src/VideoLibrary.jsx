import { useEffect, useState, useRef } from "react";
import AppButton from "./AppButton";
import { useI18n } from "./i18n";

export default function AIAudioLibrary({ token, userData, channel }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useI18n();

  const [files, setFiles] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    upload_video(file);
  };

  useEffect(() => {
    if (!channel || !token || !userData) return;
    loadVideoLibrary();
  }, [userData, channel, token]);
  
  const loadVideoLibrary = () => {
    if (!channel || !token || !userData) return;

    fetch(`${API_URL}/media/video_library?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      }
    })
      .then(res => res.json())
      .then(data => setFiles(data.files));
  };

  const playVideo = (filename) => {
    setCurrentVideo(`${API_URL}/${filename}`);
  };

  const upload_video = async (file) => {
    setIsGenerating(true);

    const formData = new FormData();
    formData.append("user_id", userData.user_uid);
    formData.append("channel_id", channel.channel_uid);
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/media/upload_video`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        console.log("Progress:", percent.toFixed(1));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        loadVideoLibrary();
      }

      setIsGenerating(false);
    };

    xhr.send(formData);

    loadVideoLibrary();
  };

  const handleDeleteVideo = async (filename) => {
    if (!window.confirm(t("videoLibrary.confirmDelete"))) return;

    try {
      const res = await fetch(`${API_URL}/media/delete_video`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userData.user_uid,
          channel_id: channel.channel_uid,
          filename: filename
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(t("common.errorPrefix", { message: err.detail }));
        return;
      }
        
      loadVideoLibrary();

    } catch (e) {
      console.error(e);
      alert(t("videoLibrary.deleteFailed"));
    }
  };

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20, maxHeight: "400px"}}>
      <h2>{t("videoLibrary.title")}</h2>
      {/* <span>Available generations: {userData?.ai_tracks_num}</span> */}

      <AppButton onClick={handleClick} disabled={isGenerating}>
          {isGenerating ? t("videoLibrary.uploading") : t("videoLibrary.upload")}
      </AppButton>

      <ul style={{ listStyle: "none", padding: 0 }}>
          {files.map((file, idx) => (
          <li key={idx} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AppButton onClick={() => playVideo(file.url)}>
                  {t("common.play")}
              </AppButton>
              <span>{file.name}</span>
                          
              {/* Кнопка удаления */}
              <AppButton
                  onClick={() => handleDeleteVideo(file.name)}>
                  {t("common.delete")}
              </AppButton>
              </div>
          </li>
          ))}
      </ul>

      {/* <audio ref={audioRef} controls style={{ width: "100%" }} /> */}
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      
      {/* Видео-плеер */}
      {currentVideo && (
        <video
          src={currentVideo}
          controls
          autoPlay
          style={{ width: "100%", maxHeight: "300px", borderRadius: 8 }}
        />
      )}
    </div>
  );
}
