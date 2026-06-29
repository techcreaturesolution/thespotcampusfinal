
import axios from "axios";

const customFetch = axios.create({
  baseURL: import.meta.env.DEV ? "/api" : (import.meta.env.VITE_API_BASE_URL || "/api"),
  withCredentials: true,
});

// Request interceptor to attach the token
customFetch.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to save/remove token automatically
customFetch.interceptors.response.use(
  (response) => {
    // If the response contains a token, save it
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    // If the request was to a logout endpoint, remove the token
    if (
      response.config &&
      response.config.url &&
      (response.config.url.includes("/logout") || response.config.url.includes("/login/logout"))
    ) {
      localStorage.removeItem("token");
    }
    return response;
  },
  (error) => {
    // On 401 Unauthorized, clear the token
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default customFetch;
