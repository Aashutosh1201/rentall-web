import axios from "axios";

// Safely access environment variables
const getEnvVar = (key, defaultValue) => {
  try {
    return import.meta.env[key] || defaultValue;
  } catch (error) {
    console.warn(
      `Failed to access environment variable ${key}, using default value`
    );
    return defaultValue;
  }
};

const API_URL = getEnvVar("VITE_API_URL", "http://localhost:8000/api");

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
instance.interceptors.request.use(
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

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;
