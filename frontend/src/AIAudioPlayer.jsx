export default class AIAudioPlayer {
  constructor(elementId, options = {}) {
    const el = document.getElementById(elementId);
    if (!el) throw new Error("Element not found");
    this.container = el

    this.audio = document.createElement("audio");
    this.audio.src = options.src || "";
    this.audio.volume = options.volume ?? 1;
    this.audio.controls = options.controls ?? true;

    el.appendChild(this.audio);
    console.log(this.audio.src)
    this.audio.load();
  }

  play() {
    return this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
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

  onEnded(callback) {
    this.audio.onended = callback;
    // this.destroy();
  }

  destroy() {
    console.log("destroy", this.audio, this.container)
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.onended = null;

      if (this.container && this.audio.parentNode === this.container) {
        this.container.removeChild(this.audio);
      }

      this.audio = null;
      this.container = null;
    }
  }
}