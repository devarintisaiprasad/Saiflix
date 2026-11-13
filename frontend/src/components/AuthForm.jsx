import { useState } from "react";
import * as api from "../api.js";
import { useAuth } from "./AuthContext.jsx";

export default function AuthForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      login(mode === "login" ? await api.login(form) : await api.register(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="logo">SAIFLIX</span>
        <small>by Devarinti Saiprasad</small>
      </div>
      <form className="auth-box" onSubmit={submit}>
        <h1>{mode === "login" ? "Sign In" : "Create account"}</h1>
        {mode === "register" && (
          <label>Name<input value={form.name} onChange={set("name")} required /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
        <label>
          Password{mode === "register" && " (6+ characters)"}
          <input type="password" value={form.password} onChange={set("password")} minLength={mode === "register" ? 6 : undefined} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn red" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign In" : "Sign Up"}</button>
        <p className="switch">
          {mode === "login" ? "New to SaiFlix? " : "Already a member? "}
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Sign up now" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
