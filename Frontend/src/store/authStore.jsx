import { create } from "zustand";

export const useAuthStore = create((set) => ({

user: localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null,

token: localStorage.getItem("token") || null,
refreshToken: localStorage.getItem("refreshToken") || null,


  // Save User and token
login: (userData, accessToken, refreshToken) => {
  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("token", accessToken);
  localStorage.setItem("refreshToken", refreshToken);

  set({
    user: userData,
    token: accessToken,
    refreshToken,
  });
},

logout: () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");

  set({
    user: null,
    token: null,
    refreshToken: null,
  });
},}));
   