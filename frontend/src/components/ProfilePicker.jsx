import { useEffect, useState } from "react";
import * as api from "../api.js";
import { useAuth } from "./AuthContext.jsx";

export const avatarColor = (hue) => `hsl(${hue} 65% 45%)`;

// "Who's watching?" screen
export default function ProfilePicker() {
  const { selectProfile, logout } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [manage, setManage] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.getProfiles().then(setProfiles).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function add() {
    const name = window.prompt("Profile name:");
    if (!name?.trim()) return;
    try { await api.createProfile(name); setError(""); load(); } catch (e) { setError(e.message); }
  }
  async function rename(p) {
    const name = window.prompt("New name:", p.name);
    if (!name?.trim()) return;
    try { await api.renameProfile(p.id, name); load(); } catch (e) { setError(e.message); }
  }
  async function remove(p) {
    if (!window.confirm(`Delete profile "${p.name}" and its list?`)) return;
    try { await api.deleteProfile(p.id); setError(""); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div className="picker">
      <span className="logo small">SAIFLIX</span>
      <h1>Who's watching?</h1>
      <div className="profiles">
        {profiles.map((p) => (
          <div key={p.id} className="profile">
            <button className="avatar" style={{ background: avatarColor(p.avatar) }} onClick={() => (manage ? rename(p) : selectProfile(p))} aria-label={manage ? `Rename ${p.name}` : `Watch as ${p.name}`}>
              {p.name[0].toUpperCase()}
              {manage && <span className="edit">✎</span>}
            </button>
            <span>{p.name}</span>
            {manage && <button className="link-del" onClick={() => remove(p)}>Delete</button>}
          </div>
        ))}
        {profiles.length < 4 && (
          <div className="profile">
            <button className="avatar add" onClick={add} aria-label="Add profile">+</button>
            <span>Add profile</span>
          </div>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="picker-actions">
        <button className="btn ghost" onClick={() => setManage(!manage)}>{manage ? "Done" : "Manage profiles"}</button>
        <button className="btn ghost" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
