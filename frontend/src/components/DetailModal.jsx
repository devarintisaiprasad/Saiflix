import { useEffect } from "react";
import Poster from "./Poster.jsx";

export default function DetailModal({ title, similar, onClose, onPlay, onToggleList, onToggleLike, onSelect }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resumable = title.seconds > 0 && title.durationSeconds && title.seconds < title.durationSeconds - 2;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title.title} onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-art" style={{ background: `linear-gradient(155deg, hsl(${title.hue} 70% 40%), hsl(${(title.hue + 50) % 360} 65% 12%))` }}>
          <h2>{title.title}</h2>
          <div className="actions">
            <button className="btn white" onClick={() => onPlay(title.id)}>▶ {resumable ? "Resume" : "Play"}</button>
            <button className="icon-btn" onClick={() => onToggleList(title)} aria-pressed={title.inList} aria-label={title.inList ? "Remove from My List" : "Add to My List"}>
              {title.inList ? "✓" : "+"}
            </button>
            <button className={title.liked ? "icon-btn on" : "icon-btn"} onClick={() => onToggleLike(title)} aria-pressed={title.liked} aria-label="Like">👍</button>
          </div>
        </div>
        <div className="modal-body">
          <p className="meta">
            <b>{title.year}</b> <span className="tag">{title.maturity}</span> {title.runtime} · {title.genre} · {title.type === "series" ? "Series" : "Movie"} · {title.likes} {title.likes === 1 ? "like" : "likes"}
          </p>
          <p>{title.description}</p>
          {similar.length > 0 && (
            <>
              <h3>More like this</h3>
              <div className="similar">
                {similar.map((s) => (
                  <button key={s.id} className="card" onClick={() => onSelect(s.id)} aria-label={`Open ${s.title}`}>
                    <Poster title={s} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
