import React, { useEffect, useState } from "react";
import AppButton from "./AppButton";
import ListEditor from "./ListEditor";
import Input from "./Input";         // твой компонент Input


function Textarea({ label, value, onChange }) {
return (
    <div style={{ marginBottom: 12 }}>
    <div style={{ marginBottom: 4 }}>{label}</div>
    <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        style={{
        width: "100%",
        padding: 8,
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        }}
    />
    </div>
);
}

export default function ChannelManager({ token, channel,  userData, onSave, onDelete }) {
  const API_URL = import.meta.env.VITE_API_URL;

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
    if (!window.confirm("Are you sure you want to delete this channel?")) return;

    try {
      const res = await fetch(`${API_URL}/channels/${channel_uid}?user_uid=${userData.user_uid}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        alert("Error: " + err.detail);
        return;
      }
        
      onDelete(channel_uid);

    } catch (e) {
      console.error(e);
      alert("Failed to delete channel");
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
            <h3>Edit Channel</h3>
            <br />
            <hr style={{ marginBottom: 20, borderColor: "rgba(255,255,255,0.1)" }} />

            <Input label="Name" value={editedChannel.name}
            onChange={v => handleChange("name", v)} />

            <Input label="Type" value={editedChannel.type}
            onChange={v => handleChange("type", v)} />

            <Textarea label="Style" value={editedChannel.style || ""}
            onChange={v => handleChange("style", v)} />

            <Input label="Location" value={editedChannel.location || ""}
            onChange={v => handleChange("location", v)} />

            <Textarea label="Description" value={editedChannel.description || ""}
            onChange={v => handleChange("description", v)} />

            <br />
            <br />
            <br />
            <h3>Edit Voice</h3>
            <br />
            <hr style={{ marginBottom: 20, borderColor: "rgba(255,255,255,0.1)" }} />

            <Input label="Source" value={editedChannel.voice.source || ""}
            onChange={v => handleChange("voice.source", v)} />

            <Input label="Name" value={editedChannel.voice.name || ""}
            onChange={v => handleChange("voice.name", v)} />

            <Input label="Sex" value={editedChannel.voice.sex || ""}
            onChange={v => handleChange("voice.sex", v)} />

            <br />
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
            />

            <div style={{ marginTop: 20 }}>
            <AppButton onClick={saveChannel} disabled={loading}>
                {loading ? "Saving..." : "Save"}
            </AppButton>

            {/* Кнопка удаления */}
            <AppButton
                onClick={() => handleDeleteChannel(channel.channel_uid)}>
                Delete
            </AppButton>
            </div>
        </div>
    </div>
  );
}