import { useEffect, useState, useRef } from "react";
import AppButton from "./AppButton";
import Textarea from "./Textarea"; 
import PhraseGenerator from "./PhraseGenerator"


export default function AIAudioLibrary({ token, userData, channel, onSave }) {
  const API_URL = import.meta.env.VITE_API_URL;
  
  const [loading, setLoading] = useState(false);
  const [editedChannel, setEditedChannel] = useState({ ...channel });
  
  const [adPhrase, setAdPhrase] = useState("");

  const [files, setFiles] = useState([]);
  const audioRef = useRef(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    setEditedChannel({ ...channel });
  }, [channel?.channel_uid]);

  useEffect(() => {
    if (!channel || !token || !userData) return;
    loadSpeechLibrary();
  }, [userData, channel, token]);
  
  const loadSpeechLibrary = () => {
    if (!channel || !token || !userData) return;

    fetch(`${API_URL}/media/prerecord_ad_phrases_library?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}`, {
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
    const res = await fetch(`${API_URL}/media/generate_ad_phrase_speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userData.user_uid, 
        channel_id: channel.channel_uid, 
        text: adPhrase
      })
    })
    setIsGenerating(false);

    if (!res.ok) throw new Error("Generate ad speech failed");

    loadSpeechLibrary();
  };

  const generateText = async () => {
    setIsGenerating(true);
    const res = await fetch(`${API_URL}/dj/ad_phrase_text`, {
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

    setAdPhrase(res["text"])
  };
  
  const handleChange = (field, value) => {
    setEditedChannel(prev => {
        if (field.includes(".")) {
        const keys = field.split("."); // ["voice", "source"]
        return {
            ...prev,
            [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: value,
            },
        };
        }
        return { ...prev, [field]: value };
    });
  };

  const saveChannel = async () => {
    setLoading(true);

    const payload = {
        user_id: userData.user_uid,
        name: editedChannel.name,
        type: editedChannel.type,
        style: editedChannel.style,
        description: editedChannel.description,
        location: editedChannel.location,
        voice_json: JSON.stringify({"source": editedChannel.voice.source, "name": editedChannel.voice.name, "sex": editedChannel.voice.sex}),
        actions_json: JSON.stringify(editedChannel.actions),
        menu_json: JSON.stringify(editedChannel.menu),
        sources_json: JSON.stringify(editedChannel.sources),
        url: editedChannel.url,
    };
    await fetch(`${API_URL}/channels/${editedChannel.channel_uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    onSave(editedChannel);
    // loadChannels();
  };


  return (
    <div style={{ 
            display: "flex",     
            width: "100%", 
            flexDirection: "column",
            height: "100%", // или 100vh или фиксированная высота
            maxHeight: 800
        }}>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        <h2>🎧 Ad Phrases Library</h2>
        <span>Available generations: {userData?.prerecord_ad_num}</span>
      
        <AppButton onClick={() => {}} style={{ marginTop: 8, width: "fit-content" }}>➕ Add Ad Phrase</AppButton>

        <ul style={{ listStyle: "none", padding: 0 }}>
            {editedChannel.actions.map((action, idx) => (
            <li key={idx} style={{ marginBottom: 10 }}>
              <PhraseGenerator text={action}/>
            </li>
            ))}
        </ul>

        <audio ref={audioRef} controls style={{ width: "100%" }} />
      </div>
    </div>
  );
}