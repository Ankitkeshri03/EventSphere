import axios from "axios";

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: "https://eventsphere-backend-o63e.onrender.com",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
