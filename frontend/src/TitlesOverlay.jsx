import React from "react";

export default function TitlesOverlay({
  topTitle = "Другое Место",
  topSub = "Артиллерийская • Калининград • −2°C • сильный ветер",
  nowPlaying = "Rodriguez Jr — Mistral",
  nextTrack = "Далее: Tale Of Us — Nova",
  zIndex = 999,
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1920 1080"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ================= TOP ================= */}
        <g>
          {/* Заливка сверху линии */}
          <path
            fill="#000"
            fillOpacity="1"
            d="
                M 0 0
                L 1920 0
                L 1920 220
                C 1440 180, 960 250, 0 250
                Z
            "
          />

          {/* Пунктирная линия точно по той же кривой */}
          {/* <path
            fill="none"
            stroke="#fff"
            strokeOpacity="0.25"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="22 16"
            d="
                M 0 120
                C 1440 60, 960 140, 0 80
            "
            >
            <animate
                attributeName="stroke-dashoffset"
                values="0;160"
                dur="6s"
                repeatCount="indefinite"
            />
          </path> */}

          {/* Текст */}
          <text
            x="110"
            y="150"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="44"
            fontWeight="800"
            fill="#fff"
          >
            {topTitle}
          </text>

          {/* <text
            x="110"
            y="215"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="30"
            fontWeight="600"
            fill="#fff"
            opacity="0.9"
          >
            {topSub}
          </text> */}
        </g>

        {/* ================= BOTTOM ================= */}
        <g>
          {/* Форма с заливкой */}
          <path
            fill="#000"
            fillOpacity="1"
            d="
                M 0 1080
                L 1920 1080
                L 1920 950
                C 1600 980, 960 900, 0 900
                Z
            "
          />

          {/* Пунктир */}
          {/* <path
            fill="none"
            stroke="#fff"
            strokeOpacity="0.25"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="24 14"
            d="
              M 0 960
              C 260 880, 620 1070, 980 980
              C 1300 900, 1540 1070, 1920 945
            "
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;180"
              dur="5.4s"
              repeatCount="indefinite"
            />
          </path> */}

          {/* Текст */}
          <text
            x="110"
            y="1005"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="64"
            fontWeight="900"
            fill="#fff"
          >
            {nowPlaying}
          </text>

          <text
            x="110"
            y="1060"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="36"
            fontWeight="700"
            fill="#fff"
            opacity="0.5"
          >
            Далее: {nextTrack}
          </text>
        </g>
      </svg>
    </div>
  );
}
