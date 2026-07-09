
import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return "/api";
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const currentOrigin = window.location.origin;
  if (envUrl) {
    if (envUrl.includes("localhost") && !currentOrigin.includes("localhost")) {
      return `${currentOrigin}/api`;
    }
    return envUrl;
  }
  return "/api";
};

const customFetch = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Simple in-memory cache for request signatures to prevent duplicate submissions
const requestCache = new Map();
const CACHE_TTL_MS = 3000; // 3 seconds window for double clicks

const getRequestSignature = (config) => {
  const method = config.method || "";
  const url = config.url || "";
  
  let dataStr = "";
  if (config.data) {
    if (config.data instanceof FormData) {
      // Signature for FormData uses key/value/file metadata
      const keys = [];
      for (const [key, value] of config.data.entries()) {
        if (value instanceof File) {
          keys.push(`${key}:${value.name}:${value.size}`);
        } else {
          keys.push(`${key}:${value}`);
        }
      }
      dataStr = keys.sort().join("|");
    } else {
      dataStr = typeof config.data === "string" ? config.data : JSON.stringify(config.data);
    }
  }

  return `${method.toLowerCase()}:${url}:${dataStr}`;
};

// Request interceptor to attach the token and auto-idempotency keys
customFetch.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Apply auto-idempotency key for mutating requests (POST, PUT, PATCH, DELETE)
    const isMutating = ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase());
    if (isMutating && !config.headers["Idempotency-Key"] && !config.headers["x-idempotency-key"]) {
      const signature = getRequestSignature(config);
      let idempotencyKey = requestCache.get(signature);

      if (!idempotencyKey) {
        idempotencyKey = `idemp-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
        requestCache.set(signature, idempotencyKey);
        
        setTimeout(() => {
          requestCache.delete(signature);
        }, CACHE_TTL_MS);
      }
      
      config.headers["Idempotency-Key"] = idempotencyKey;
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
