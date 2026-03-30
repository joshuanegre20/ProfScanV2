
//import axios from "axios";
//
//const api = axios.create({
//  baseURL: "http://127.0.0.1:8000/api",
//  
//  headers: {
//    "Accept": "application/json",
//    "Content-Type": "application/json",
//  },
//});
//
//api.interceptors.request.use((config) => {
//  const token = localStorage.getItem("token");
//  if (token && config.headers) {
//    config.headers.Authorization = `Bearer ${token}`;
//  }
//  return config;
//});
//
//export default api
import axios from "axios"
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://172.17.96.1:8000"}/api`,
});

// attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;