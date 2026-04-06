import { useEffect, useState, useRef } from "react";
import AppButton from "./AppButton";
import PhraseGenerator from "./PhraseGenerator"
import TextArea from "./TextArea"; 


export default function AdPhrasesLibrary({ token, userData, channel, onSave }) {
  const API_URL = import.meta.env.VITE_API_URL;
  
  const [loading, setLoading] = useState(false);
  const [editedChannel, setEditedChannel] = useState({ ...channel });
  
  const [adPhrase, setAdPhrase] = useState("");

  const [ads, setAds] = useState([]);
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
      .then(data => setAds(data.ads));
  };

  const playAudio = async (ad) => {
    if (audioRef.current) {    
      const res = await fetch(
        `${API_URL}/media/speech?user_id=${userData.user_uid}&channel_id=${channel.channel_uid}&filename=${ad.filename}&type=${ad.type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Audio fetch failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  const generateAudio = async (ad) => {

    updateAd(ad);

    setIsGenerating(true);
    const res = await fetch(`${API_URL}/media/generate_ad_phrase_speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        ad_id: ad.ad_id,
        user_id: userData.user_uid, 
        channel_id: channel.channel_uid, 
        ad_text: ad.speech
      })
    })
    setIsGenerating(false);

    if (!res.ok) throw new Error("Generate ad speech failed");

    loadSpeechLibrary();
  };

  const generateText = async (ad) => {

    updateAd(ad);

    setIsGenerating(true);
    const res = await fetch(`${API_URL}/dj/ad_phrase_text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        ad_id: ad.ad_id,
        user_id: userData.user_uid, 
        channel_id: channel.channel_uid
      })
    })

    const data = await res.json(); 

    setIsGenerating(false);

    if (!res.ok) throw new Error("Generate ai track failed");

    setAds(prev =>
      prev.map(item =>
        item.ad_id === ad.ad_id
          ? { ...item, speech: data.text }
          : item
      )
    );

    ad.speech = data.text; 

    updateAd(ad)
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

  
  const addAd = async () => {
    setLoading(true);

    const payload = {
        user_id: userData.user_uid,
        channel_id: editedChannel.channel_uid
    };
    await fetch(`${API_URL}/media/add_prerecord_ad_phrase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    loadSpeechLibrary();

    setLoading(false);
  };

  
  const updateAd = async (ad) => {
    setLoading(true);

    console.log("Updating ad:", ad);

    const payload = {
        ad_id: ad.ad_id,
        user_id: userData.user_uid,
        channel_id: editedChannel.channel_uid,
        ad_text: ad.ad_text,
        speech: ad.speech
    };
    await fetch(`${API_URL}/media/update_prerecord_ad_phrase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    loadSpeechLibrary();

    setLoading(false);
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
        
        <AppButton onClick={addAd} style={{ marginTop: 8, width: "fit-content" }}>➕ Add Ad Phrase</AppButton>

        <ul style={{ listStyle: "none", padding: 0 }}>
            {ads.map((ad, idx) => (
            <li key={idx} style={{ marginBottom: 10 }}>
              <PhraseGenerator ad={ad} generateText={generateText} generateAudio={generateAudio} playAudio={playAudio}/>
            </li>
            ))}
        </ul>

        <audio ref={audioRef} controls style={{ width: "100%" }} />
      </div>
    </div>
  );
}