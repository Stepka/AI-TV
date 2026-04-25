import React, { useState, useEffect } from "react";
import AppButton from "./AppButton";

export default function Playlist({ token, userData, channel, onLoadPlaylist, playlist, loading}) {

  return (
    <div style={{ width: "100%", marginTop: 20 }}>
      {/* Кнопка Load Playlist — только если плейлист пустой */}
      {/* {playlist.length === 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",  // центрируем по горизонтали
            marginBottom: 20,
            width: "100%",
          }}
        >
          <AppButton
            onClick={() => onLoadPlaylist(10)}
            disabled={loading} // неактивна во время загрузки
          >
            {loading ? "Loading..." : "Load Playlist"}
          </AppButton>
        </div>
      )} */}

      {/* Горизонтальный список плиток */}
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          paddingBottom: 8,
        }}
      >
        {playlist.map((item, index) => (
          <div
            key={item.videoId || index}
            style={{
              minWidth: 180,
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 10,
              background: "rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>
              {item.artist} - {item.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}