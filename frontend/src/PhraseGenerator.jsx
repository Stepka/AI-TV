import React, { useState, useEffect } from "react";
import AppButton from "./AppButton"; 
import Textarea from "./Textarea"; 

export default function PhraseGenerator({ ad, playAudio, generateText, generateAudio, save }) {
  
  const [editingAd, setEditingAd] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    setEditingAd(ad);
  }, [ad]);

  return (
    <div style={{ marginBottom: 10, padding: 20, border: "1px solid #333", "borderRadius": "10px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "100%" }}>
                <Textarea label="Original text" value={editingAd.ad_text || ""} 
                      onChange={v =>
                        setEditingAd(prev => ({
                        ...prev,
                        ad_text: v
                        }))
                    }/>
                <Textarea label="Speech" value={editingAd.speech || ""} 
                    onChange={v =>
                        setEditingAd(prev => ({
                        ...prev,
                        speech: v
                        }))
                    }/>
            </div>
            
            <AppButton onClick={() => generateText(editingAd)} disabled={isGenerating}>
                {isGenerating ? "Generating phrase..." : "✍️ Generate text"}
            </AppButton>

            <AppButton onClick={() => generateAudio(editingAd)} disabled={isGenerating}>
                {isGenerating ? "Generating audio..." : "🎵 Generate audio"}
            </AppButton>

            <AppButton onClick={() => save(editingAd)} disabled={isGenerating}>
                {isGenerating ? "Saving..." : "Save"}
            </AppButton>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AppButton onClick={() => playAudio(editingAd)}>
            ▶ Play
        </AppButton>
        <span>{editingAd.filename}</span>
        </div>
    </div>
  );
}