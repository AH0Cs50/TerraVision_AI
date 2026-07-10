



import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5500/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
   if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;





api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "Access token expired" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      const response = await axios.post(
        "http://localhost:5500/api/v1/auth/refresh",
        {
          refreshToken,
        }
      );

      localStorage.setItem(
        "token",
        response.data.data.accessToken
      );

      localStorage.setItem(
        "refreshToken",
        response.data.data.refreshToken
      );

      originalRequest.headers.Authorization =
        `Bearer ${response.data.data.accessToken}`;

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);