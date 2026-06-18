
import axios from "axios";

const customFetch = axios.create({
  baseURL: import.meta.env.DEV ? "/api" : (import.meta.env.VITE_API_BASE_URL || "/api"),
  withCredentials: true,
});

export default customFetch;
