// All calls to the backend live here. The login token is added automatically.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(url, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized(); // expired token: log out
    throw new Error(data.error || "Request failed");
  }
  return data;
}

const send = (method, body) => ({ method, body: JSON.stringify(body) });

// Auth
export const register = (body) => request("/api/auth/register", send("POST", body));
export const login = (body) => request("/api/auth/login", send("POST", body));
export const getMe = () => request("/api/auth/me");

// Profiles
export const getProfiles = () => request("/api/profiles");
export const createProfile = (name) => request("/api/profiles", send("POST", { name }));
export const renameProfile = (id, name) => request(`/api/profiles/${id}`, send("PATCH", { name }));
export const deleteProfile = (id) => request(`/api/profiles/${id}`, { method: "DELETE" });

// Catalogue and per-profile actions
export const getTitles = (pid) => request(`/api/profiles/${pid}/titles`);
export const addToList = (pid, tid) => request(`/api/profiles/${pid}/list/${tid}`, { method: "PUT" });
export const removeFromList = (pid, tid) => request(`/api/profiles/${pid}/list/${tid}`, { method: "DELETE" });
export const likeTitle = (pid, tid) => request(`/api/profiles/${pid}/likes/${tid}`, { method: "PUT" });
export const unlikeTitle = (pid, tid) => request(`/api/profiles/${pid}/likes/${tid}`, { method: "DELETE" });
export const saveProgress = (pid, tid, seconds, duration) =>
  request(`/api/profiles/${pid}/progress/${tid}`, send("PUT", { seconds, duration }));

// Admin
export const adminStats = () => request("/api/admin/stats");
export const adminUsers = () => request("/api/admin/users");
export const adminSetRole = (id, role) => request(`/api/admin/users/${id}/role`, send("PATCH", { role }));
export const adminDeleteUser = (id) => request(`/api/admin/users/${id}`, { method: "DELETE" });
export const adminAddTitle = (body) => request("/api/admin/titles", send("POST", body));
export const adminDeleteTitle = (id) => request(`/api/admin/titles/${id}`, { method: "DELETE" });
