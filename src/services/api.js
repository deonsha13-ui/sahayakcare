const API_BASE = import.meta.env.VITE_API_URL || "https://sahayak-care-wy1s.onrender.com";

export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText}`);
  }
  return res.json();
}

export function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (API_BASE.startsWith("https://")) {
    return API_BASE.replace("https://", "wss://") + "/ws";
  }
  if (API_BASE.startsWith("http://")) {
    return API_BASE.replace("http://", "ws://") + "/ws";
  }
  return "ws://localhost:8000/ws";
}
