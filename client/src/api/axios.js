import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("accessToken");
  if (t) cfg.headers["Authorization"] = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
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
        const token = r.data.accessToken;
        localStorage.setItem("accessToken", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        orig.headers["Authorization"] = `Bearer ${token}`;
        return api(orig);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
