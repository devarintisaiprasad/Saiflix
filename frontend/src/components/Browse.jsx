import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "../api.js";
import { useAuth } from "./AuthContext.jsx";
import { avatarColor } from "./ProfilePicker.jsx";
import Row from "./Row.jsx";
import Poster from "./Poster.jsx";
import DetailModal from "./DetailModal.jsx";
import Player from "./Player.jsx";
import Admin from "./Admin.jsx";

// The main Netflix-style screen
export default function Browse() {
  const { user, profile, selectProfile, logout } = useAuth();
  const [titles, setTitles] = useState([]);
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setTitles(await api.getTitles(profile.id));
      setError("");
    } catch {
      setError("Could not load titles. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [profile.id]);
  useEffect(() => { load(); }, [load]);

  // Update one title in memory so the screen reacts instantly
  const patch = (id, changes) => setTitles((all) => all.map((t) => (t.id === id ? { ...t, ...changes } : t)));

  async function toggleList(t) {
    try {
      await (t.inList ? api.removeFromList(profile.id, t.id) : api.addToList(profile.id, t.id));
      patch(t.id, { inList: !t.inList });
    } catch (e) { setError(e.message); }
  }
  async function toggleLike(t) {
    try {
      await (t.liked ? api.unlikeTitle(profile.id, t.id) : api.likeTitle(profile.id, t.id));
      patch(t.id, { liked: !t.liked, likes: t.likes + (t.liked ? -1 : 1) });
    } catch (e) { setError(e.message); }
  }
  const onProgress = (id, seconds, durationSeconds) => patch(id, { seconds, durationSeconds, watchedAt: new Date().toISOString() });

  const featured = titles.find((t) => t.featured) || titles[0];
  const selected = titles.find((t) => t.id === selectedId);
  const playing = titles.find((t) => t.id === playingId);

  // Build the rows
  const rows = useMemo(() => {
    const out = [];
    const continuing = titles
      .filter((t) => t.seconds > 0 && t.durationSeconds && t.seconds < t.durationSeconds - 2)
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
    if (continuing.length) out.push([`Continue Watching for ${profile.name}`, continuing]);
    const mine = titles.filter((t) => t.inList);
    if (mine.length) out.push(["My List", mine]);
    const popular = [...titles].sort((a, b) => b.likes - a.likes || a.id - b.id).slice(0, 10);
    out.push(["Trending Now", popular]);
    [...new Set(titles.map((t) => t.genre))].forEach((g) => out.push([g, titles.filter((t) => t.genre === g)]));
    return out;
  }, [titles, profile.name]);

  const q = query.trim().toLowerCase();
  const results = q ? titles.filter((t) => [t.title, t.genre, t.description].some((s) => s.toLowerCase().includes(q))) : [];
  const grid = (list, empty) => (
    list.length === 0 ? <p className="status">{empty}</p> : (
      <div className="grid">
        {list.map((t) => (
          <button key={t.id} className="card" onClick={() => setSelectedId(t.id)} aria-label={`Open ${t.title}`}>
            <Poster title={t} />
          </button>
        ))}
      </div>
    )
  );

  const goTab = (key) => { setTab(key); setQuery(""); };

  return (
    <div className="browse">
      <header className="nav">
        <span className="logo small">SAIFLIX</span>
        <nav aria-label="Main">
          <button className={tab === "home" && !q ? "active" : ""} onClick={() => goTab("home")}>Home</button>
          <button className={tab === "list" && !q ? "active" : ""} onClick={() => goTab("list")}>My List</button>
          {user.role === "admin" && <button className={tab === "admin" ? "active" : ""} onClick={() => goTab("admin")}>Admin</button>}
        </nav>
        <input className="search" type="search" placeholder="Search titles, genres" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
        <button className="me" onClick={() => selectProfile(null)} title="Switch profile">
          <span className="avatar tiny" style={{ background: avatarColor(profile.avatar) }}>{profile.name[0].toUpperCase()}</span>
          <span className="me-name">{profile.name}</span>
        </button>
        <button className="nav-out" onClick={logout}>Sign out</button>
      </header>

      {loading && <p className="status">Loading…</p>}
      {error && <p className="status error">{error}</p>}

      {q ? (
        <main className="page"><h2 className="page-title">Results for "{query}"</h2>{grid(results, "No titles match your search.")}</main>
      ) : tab === "admin" && user.role === "admin" ? (
        <main className="page"><Admin titles={titles} onTitlesChanged={load} /></main>
      ) : tab === "list" ? (
        <main className="page"><h2 className="page-title">My List</h2>{grid(titles.filter((t) => t.inList), "Your list is empty. Open a title and press + to add it.")}</main>
      ) : (
        <main>
          {featured && (
            <section className="hero" style={{ background: `linear-gradient(110deg, #0b0b0f 25%, transparent 75%), linear-gradient(155deg, hsl(${featured.hue} 70% 40%), hsl(${(featured.hue + 50) % 360} 65% 12%))` }}>
              <div className="hero-text">
                <small>{featured.genre} · {featured.year}</small>
                <h1>{featured.title}</h1>
                <p>{featured.description}</p>
                <div className="actions">
                  <button className="btn white" onClick={() => setPlayingId(featured.id)}>▶ Play</button>
                  <button className="btn dim" onClick={() => setSelectedId(featured.id)}>ⓘ More Info</button>
                </div>
              </div>
            </section>
          )}
          <div className="rows">
            {rows.map(([name, list]) => <Row key={name} name={name} titles={list} onSelect={setSelectedId} />)}
          </div>
        </main>
      )}

      <footer>
        <p>SaiFlix: a learning project by <b>Devarinti Saiprasad</b>. The catalogue is made up and not connected to any streaming service.</p>
      </footer>

      {selected && !playing && (
        <DetailModal
          title={selected}
          similar={titles.filter((t) => t.genre === selected.genre && t.id !== selected.id).slice(0, 4)}
          onClose={() => setSelectedId(null)}
          onPlay={(id) => setPlayingId(id)}
          onToggleList={toggleList}
          onToggleLike={toggleLike}
          onSelect={setSelectedId}
        />
      )}
      {playing && <Player title={playing} profileId={profile.id} onClose={() => setPlayingId(null)} onProgress={onProgress} />}
    </div>
  );
}
