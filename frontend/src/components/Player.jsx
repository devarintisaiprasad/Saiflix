import { useEffect, useRef, useState } from "react";
import * as api from "../api.js";

// Sample clips (free to use). A real service would stream the actual title here.
const SOURCES = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
];

export default function Player({ title, profileId, onClose, onProgress }) {
  const videoRef = useRef(null);
  const lastSaved = useRef(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Save where the viewer is (so "Continue Watching" works)
  function save(force = false) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const now = Date.now();
    if (!force && now - lastSaved.current < 3000) return;
    lastSaved.current = now;
    const seconds = Math.floor(v.currentTime);
    const duration = Math.floor(v.duration);
    api.saveProgress(profileId, title.id, seconds, duration).catch(() => {});
    onProgress(title.id, seconds, duration);
  }

  function resume() {
    const v = videoRef.current;
    // Start from the saved position unless the title was already finished
    if (title.seconds > 0 && title.durationSeconds && title.seconds < title.durationSeconds - 2 && title.seconds < v.duration - 1) {
      v.currentTime = title.seconds;
    }
  }

  function close() {
    save(true);
    onClose();
  }

  return (
    <div className="player-overlay">
      <div className="player-bar">
        <button className="btn ghost" onClick={close}>← Back</button>
        <span>{title.title}</span>
      </div>
      {failed ? (
        <p className="player-error">The sample video could not load. Check your internet connection.</p>
      ) : (
        <video
          ref={videoRef}
          controls
          autoPlay
          onLoadedMetadata={resume}
          onTimeUpdate={() => save()}
          onPause={() => save(true)}
          onEnded={() => save(true)}
          onError={() => setFailed(true)}
        >
          {SOURCES.map((s) => <source key={s} src={s} type="video/mp4" />)}
        </video>
      )}
      <p className="player-note">Sample clip for the demo. Streaming full movies is not part of this learning project.</p>
    </div>
  );
}
