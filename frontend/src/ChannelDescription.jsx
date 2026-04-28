import React from "react";
import { useI18n } from "./i18n";

export default function ChannelDescription({ channel }) {
  const { t } = useI18n();
  if (!channel) return null;

  return (
    <div
      style={{
        width: "100%",
        padding: "16px",
        background: "rgba(0,0,0,0.5)",
        borderRadius: 12,
        marginBottom: 20,
        textAlign: "center",
        color: "#fff",
      }}
    >
      <h2>{channel.name}</h2>
      <p>{channel.description || t("channels.noDescription")}</p>
    </div>
  );
}
