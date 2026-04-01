import React, { useState, useEffect } from "react";
import AppButton from "./AppButton"; 
import Textarea from "./Textarea"; 

export default function PhraseGenerator({ text, playAudio, generateText, generateAudio }) {
  
  const [phraseObject, setPhrase] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    setPhrase(text);
  }, [text]);

  return (
    <div style={{ marginBottom: 10, padding: 20, border: "1px solid #333", "border-radius": "10px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "100%" }}>
        <Textarea label="Phrase" value={phraseObject || ""} 
            onChange={v => setPhrase(v)}/>
            
        <AppButton onClick={generateText} disabled={isGenerating}>
            {isGenerating ? "Generating phrase..." : "✍️ Generate text"}
        </AppButton>

        <AppButton onClick={generateAudio} disabled={isGenerating}>
            {isGenerating ? "Generating audio..." : "🎵 Generate audio"}
        </AppButton>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AppButton onClick={() => playAudio(phraseObject.url)}>
            ▶ Play
        </AppButton>
        <span>{phraseObject.filename}</span>
        </div>
    </div>
  );
}