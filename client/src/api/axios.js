import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true, // send cookies (refresh token)
});

// auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const r = await axios.post(
          "http://localhost:4000/api/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = r.data.accessToken;
        localStorage.setItem("accessToken", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        orig.headers["Authorization"] = `Bearer ${newToken}`;
        return api(orig);
      } catch {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("accessToken");
  if (t) cfg.headers["Authorization"] = `Bearer ${t}`;
  return cfg;
});

export default api;
