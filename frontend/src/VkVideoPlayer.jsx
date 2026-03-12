import React from "react";
import { useEffect, useRef } from "react";

const VkVideoPlayer = ({
  oid,
  id,
  hash,
  autoplay = 0,
  width = "100%",
  height = "100%",
}) => {  
  
  const src = `https://vk.com/video_ext.php?oid=${oid}&id=${id}&autoplay=${autoplay}&js_api=1`;

  return (
    <div
      style={{
        position: "relative",
        width: width,
        height: height,
        paddingBottom: "56.25%", // 16:9
      }}
    >
      <iframe
        id="vkplayer"
        src={src}
        width="100%"
        height="100%"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        frameBorder="0"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
        title="VK Video Player"
      />
    </div>
  );
};

export default VkVideoPlayer;