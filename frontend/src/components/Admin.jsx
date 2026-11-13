import { useCallback, useEffect, useState } from "react";
import * as api from "../api.js";
import { useAuth } from "./AuthContext.jsx";

const empty = { title: "", year: "", genre: "", type: "movie", maturity: "13+", runtime: "", description: "" };

// Admin page: stats, add/delete titles, manage users
export default function Admin({ titles, onTitlesChanged }) {
  const { user: me } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([api.adminStats(), api.adminUsers()]);
      setStats(s);
      setUsers(u);
    } catch (err) { setNote(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function run(action, message) {
    try {
      await action();
      setNote(message);
      load();
    } catch (err) { setNote(err.message); }
  }

  async function addTitle(e) {
    e.preventDefault();
    await run(async () => {
      await api.adminAddTitle(form);
      setForm(empty);
      await onTitlesChanged();
    }, "Title added");
  }

  if (!stats) return <p className="status">{note || "Loading admin page…"}</p>;

  return (
    <section className="admin">
      <h1>Admin</h1>
      <div className="stat-row">
        <div className="stat"><span>Users</span><strong>{stats.users}</strong></div>
        <div className="stat"><span>Profiles</span><strong>{stats.profiles}</strong></div>
        <div className="stat"><span>Titles</span><strong>{stats.titles}</strong></div>
        <div className="stat"><span>Started watching</span><strong>{stats.plays}</strong></div>
      </div>
      {note && <p className="note" role="status">{note}</p>}

      <div className="admin-card">
        <h3>Add a title</h3>
        <form className="grid-form" onSubmit={addTitle}>
          <label>Title<input value={form.title} onChange={set("title")} required /></label>
          <label>Genre<input value={form.genre} onChange={set("genre")} placeholder="Action, Comedy…" required /></label>
          <label>Year<input type="number" value={form.year} onChange={set("year")} /></label>
          <label>Type
            <select value={form.type} onChange={set("type")}><option value="movie">Movie</option><option value="series">Series</option></select>
          </label>
          <label>Maturity<input value={form.maturity} onChange={set("maturity")} /></label>
          <label>Runtime<input value={form.runtime} onChange={set("runtime")} placeholder="1h 45m or 2 Seasons" /></label>
          <label className="wide">Description<textarea rows="2" value={form.description} onChange={set("description")} /></label>
          <button className="btn red">Add title</button>
        </form>
      </div>

      <div className="admin-card">
        <h3>Users</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Profiles</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}{u.id === me.id && " (you)"}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} disabled={u.id === me.id} aria-label={`Role for ${u.name}`}
                      onChange={(e) => run(() => api.adminSetRole(u.id, e.target.value), "Role updated")}>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </select>
                  </td>
                  <td>{u.profiles}</td>
                  <td>
                    <button className="link-del" disabled={u.id === me.id}
                      onClick={() => window.confirm(`Delete ${u.name}?`) && run(() => api.adminDeleteUser(u.id), "User deleted")}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h3>Catalogue ({titles.length})</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Genre</th><th>Year</th><th></th></tr></thead>
            <tbody>
              {titles.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td><td>{t.genre}</td><td>{t.year}</td>
                  <td>
                    <button className="link-del"
                      onClick={() => window.confirm(`Delete "${t.title}"?`) && run(async () => { await api.adminDeleteTitle(t.id); await onTitlesChanged(); }, "Title deleted")}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
