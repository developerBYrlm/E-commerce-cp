import axios from "axios";

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", withCredentials: true, headers: { "Content-Type": "application/json" } });
client.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }
  return config;
});
client.interceptors.response.use((response) => response, (error) => {
  const message = error.response?.data?.message || error.message || "Something went wrong";
  return Promise.reject(Object.assign(new Error(message), { status: error.response?.status, data: error.response?.data }));
});

export default client;
