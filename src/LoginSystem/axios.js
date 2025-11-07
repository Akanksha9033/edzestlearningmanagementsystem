import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
  withCredentials: true, // httpOnly refresh cookie
  timeout: 20000,
});

let _accessToken = null;

export function setAccessToken(token) { _accessToken = token || null; }
export function clearAccessToken() { _accessToken = null; }

// attach Authorization if we have a token
API.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// auto-refresh once on 401, then retry original request
let refreshing = false;
let waiters = [];
function resumeAll(token) { waiters.forEach(fn => fn(token)); waiters = []; }

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { response, config } = err || {};
    const url = config?.url || "";
    const isAuthRefresh = url.includes("/api/auth/refresh");
    const isAuthLogin   = url.includes("/api/auth/login");

    if (response?.status === 401 && !config._retry && !isAuthRefresh && !isAuthLogin) {
      config._retry = true;

      if (!refreshing) {
        refreshing = true;
        try {
          const r = await API.post("/api/auth/refresh", {}, { withCredentials: true });
          const t = r.data?.accessToken || null;
          if (t) setAccessToken(t);
          resumeAll(t);
        } catch {
          clearAccessToken();
          resumeAll(null);
        } finally {
          refreshing = false;
        }
      }

      return new Promise((resolve, reject) => {
        waiters.push((token) => {
          if (!token) return reject(err);
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          resolve(API(config));
        });
      });
    }

    return Promise.reject(err);
  }
);

export default API;
