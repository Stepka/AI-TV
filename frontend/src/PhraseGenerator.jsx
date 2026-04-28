import React, { useState, useEffect } from "react";
import AppButton from "./AppButton"; 
import TextArea from "./TextArea"; 
import { useI18n } from "./i18n";

export default function PhraseGenerator({ ad, playAudio, generateText, generateAudio, save, onDelete }) {
  const { t } = useI18n();
  
  const [editingAd, setEditingAd] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    setEditingAd(ad);
  }, [ad]);

  return (
    <div style={{ marginBottom: 10, padding: 20, border: "1px solid #333", "borderRadius": "10px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "100%" }}>
                <TextArea label={t("phrases.originalText")} value={editingAd.ad_text || ""} 
                      onChange={v =>
                        setEditingAd(prev => ({
                        ...prev,
                        ad_text: v
                        }))
                    }/>
                <TextArea label={t("phrases.speech")} value={editingAd.speech || ""} 
                    onChange={v =>
                        setEditingAd(prev => ({
                        ...prev,
                        speech: v
                        }))
                    }/>
            </div>
            
            <AppButton onClick={() => generateText(editingAd)} disabled={isGenerating}>
                {isGenerating ? t("phrases.generatePhrase") : t("phrases.generateText")}
            </AppButton>

            <AppButton onClick={() => generateAudio(editingAd)} disabled={isGenerating}>
                {isGenerating ? t("phrases.generatingAudio") : t("phrases.generateAudio")}
            </AppButton>

            <AppButton onClick={() => onDelete(editingAd)} disabled={isGenerating}>
                {isGenerating ? t("common.deleting") : t("common.delete")}
            </AppButton>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AppButton onClick={() => playAudio(editingAd)}>
            {t("common.play")}
        </AppButton>
        <span>{editingAd.filename}</span>
        </div>
    </div>
  );
}
