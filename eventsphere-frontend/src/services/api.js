import axios from "axios";

// Set VITE_API_URL at BUILD time to point at a deployed backend, e.g.
//   VITE_API_URL=https://eventsphere-backend-o63e.onrender.com npm run build
// Vite inlines it into the bundle, so it is read at build time, not runtime.
//
// The localhost fallback is what keeps `npm run dev` and docker compose working:
// hardcoding the Render URL here would make local development talk to production,
// so every local experiment would hit real data.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
