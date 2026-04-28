import React, { useEffect, useState } from "react";
import AppButton from "./AppButton";
import ListEditor from "./ListEditor";
import Input from "./Input"; 
import TextArea from "./TextArea"; 
import { useI18n } from "./i18n";

export default function ChannelManager({ token, channel,  userData, onSave, onDelete }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [editedChannel, setEditedChannel] = useState({ ...channel });

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

  useEffect(() => {
    setEditedChannel({ ...channel });
  }, [channel?.channel_uid]);

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

  // Удаляем канал
  const handleDeleteChannel = async (channel_uid) => {
    if (!window.confirm(t("channelManager.confirmDelete"))) return;

    try {
      const res = await fetch(`${API_URL}/channels/${channel_uid}?user_uid=${userData.user_uid}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        alert(t("common.errorPrefix", { message: err.detail }));
        return;
      }
        
      onDelete(channel_uid);

    } catch (e) {
      console.error(e);
      alert(t("channelManager.deleteFailed"));
    }
  };

  
  const handleFillWithLLMChannel = async () => {

    const payload = {
        user_id: userData.user_uid,
        url: editedChannel.url,
    };
    const res = await fetch(`${API_URL}/channels/${editedChannel.channel_uid}/fill_with_llm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const result = await res.json();
      console.log("result: " + result.channel);
      setEditedChannel({ ...result.channel });
      return;
    }
  };


  return (
    <div style={{ 
            display: "flex",     
            width: "100%", 
            flexDirection: "column",
            height: "100%", // или 100vh или фиксированная высота
            maxHeight: 800
        }}>

        <div style={{ 
            flexGrow: 1,
            minHeight: 0,        // важно для flex-контейнеров
            overflowY: "auto",   // включает вертикальный скролл
            paddingRight: 10,    // чтобы скролл не прилипал к тексту
         }}>
            <br />
            <br />
            <h3>{t("channelManager.editChannel")}</h3>
            <br />
            <hr style={{ marginBottom: 20, borderColor: "rgba(255,255,255,0.1)" }} />

            <Input label={t("channelManager.name")} value={editedChannel.name}
            onChange={v => handleChange("name", v)} />

            <Input label={t("channelManager.type")} value={editedChannel.type}
            onChange={v => handleChange("type", v)} />

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Input label={t("channelManager.url")} value={editedChannel.url}
              onChange={v => handleChange("url", v)} />
              <AppButton
                  onClick={handleFillWithLLMChannel}>
                  {t("channelManager.fillWithLlm")}
              </AppButton>
            </div>

            <TextArea label={t("channelManager.style")} value={editedChannel.style || ""}
            onChange={v => handleChange("style", v)} />

            <Input label={t("channelManager.location")} value={editedChannel.location || ""}
            onChange={v => handleChange("location", v)} />

            <TextArea label={t("channelManager.description")} value={editedChannel.description || ""}
            onChange={v => handleChange("description", v)} />

            <br />
            <br />
            <br />
            <h3>{t("channelManager.editVoice")}</h3>
            <br />
            <hr style={{ marginBottom: 20, borderColor: "rgba(255,255,255,0.1)" }} />

            <Input label={t("channelManager.source")} value={editedChannel.voice.source || ""}
            onChange={v => handleChange("voice.source", v)} />

            <Input label={t("channelManager.name")} value={editedChannel.voice.name || ""}
            onChange={v => handleChange("voice.name", v)} />

            <Input label={t("channelManager.sex")} value={editedChannel.voice.sex || ""}
            onChange={v => handleChange("voice.sex", v)} />

            <br />
            <br />
            <br />
            <h3>{t("channelManager.editMediaSources")}</h3>
            <br />
            <hr style={{ marginBottom: 20, borderColor: "rgba(255,255,255,0.1)" }} />

            <ListEditor
                label={t("channelManager.mediaSources")}
                value={editedChannel.sources || "[ai_audio]"}
                onChange={v => handleChange("sources", v)}
            />

            {/* <br />
            <br />
            <br />
            <h3>Edit Actions</h3>
            <br />
            <hr style={{ marginBottom: 20, borderColor: "rgba(255,255,255,0.1)" }} />

            <ListEditor
                label="Actions"
                value={editedChannel.actions || "[]"}
                onChange={v => handleChange("actions", v)}
            />

            <br />
            <br />
            <br />
            <h3>Edit Menu</h3>
            <br />
            <hr style={{ marginBottom: 20, borderColor: "rgba(255,255,255,0.1)" }} />

            <ListEditor
                label="Menu"
                value={editedChannel.menu || "[]"}
                onChange={v => handleChange("menu", v)}
            /> */}

            <div style={{ marginTop: 20 }}>
            <AppButton onClick={saveChannel} disabled={loading}>
                {loading ? t("common.saving") : t("common.save")}
            </AppButton>

            {/* Кнопка удаления */}
            <AppButton
                onClick={() => handleDeleteChannel(channel.channel_uid)}>
                {t("common.delete")}
            </AppButton>
            </div>
        </div>
    </div>
  );
}
