import { useRef } from "react";
import Poster from "./Poster.jsx";

// One horizontal row of posters with scroll arrows
export default function Row({ name, titles, onSelect }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className="row">
      <h2>{name}</h2>
      <div className="row-wrap">
        <button className="arrow left" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
        <div className="row-scroll" ref={ref}>
          {titles.map((t) => {
            const pct = t.durationSeconds ? Math.min(100, (t.seconds / t.durationSeconds) * 100) : 0;
            return (
              <button key={t.id} className="card" onClick={() => onSelect(t.id)} aria-label={`Open ${t.title}`}>
                <Poster title={t} />
                {t.inList && <span className="badge">✓</span>}
                {pct > 0 && <div className="progress"><div style={{ width: `${pct}%` }} /></div>}
              </button>
            );
          })}
        </div>
        <button className="arrow right" onClick={() => scroll(1)} aria-label="Scroll right">›</button>
      </div>
    </section>
  );
}
