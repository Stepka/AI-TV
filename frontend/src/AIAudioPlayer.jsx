export default class AIAudioPlayer {
  constructor(elementId, options = {}) {
    const el = document.getElementById(elementId);
    if (!el) throw new Error("Element not found");

    this.container = el;

    // --- VIDEO (фон) ---
    this.video = document.createElement("video");
    this.video.src = options.videoSrc || "";
    this.video.autoplay = true;
    this.video.loop = true;
    this.video.muted = true;
    this.video.playsInline = true;

    // стили как background
    Object.assign(this.video.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 0,
    });

    // --- AUDIO ---
    this.audio = document.createElement("audio");
    this.audio.src = options.src || "";
    this.audio.volume = options.volume ?? 1;
    this.audio.controls = options.controls ?? true;

    Object.assign(this.audio.style, {
      position: "relative",
      zIndex: 1,
      width: "100%",
    });

    // контейнер должен быть relative
    this.container.style.position = "relative";

    this.container.appendChild(this.video);
    // this.container.appendChild(this.audio);

    this.audio.load();
    this.video.load();
  }

  // --- AUDIO CONTROL ---
  play() {
    this.video.play().catch(() => {});
    return this.audio.play();
  }

  pause() {
    this.audio.pause();
    this.video.pause();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;

    this.video.pause();
    this.video.currentTime = 0;
  }

  setVolume(v) {
    this.audio.volume = v;
  }

  getVolume() {
    return this.audio.volume;
  }

  getDuration() {
    return this.audio.duration;
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  setCurrentTime(t) {
    this.audio.currentTime = t;
  }

  setSrc(src) {
    this.audio.src = src;
    this.audio.load();
  }

  setVideoSrc(src) {
    this.video.src = src;
    this.video.load();
    this.video.play().catch(() => {});
  }

  onEnded(callback) {
    this.audio.onended = callback;
  }

  // --- DESTROY ---
  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.onended = null;

      // if (this.audio.parentNode === this.container) {
      //   this.container.removeChild(this.audio);
      // }
    }

    if (this.video) {
      this.video.pause();
      this.video.src = "";

      if (this.video.parentNode === this.container) {
        this.container.removeChild(this.video);
      }
    }

    this.audio = null;
    this.video = null;
    this.container = null;
  }
}