// authApi.js
import api from './axios';


// Signup Request
export const signupRequest = async (userData) => {
  const { data } = await api.post('/auth/signup', userData);
  return data; 
};

// login Request
export const loginRequest = async (credentials) => {
  try {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      "Login failed"
    );
  }
};
  

export const refreshTokenRequest = async (refreshToken) => {
  const { data } = await api.post("/auth/refresh", {
    refreshToken,
  });

  return data.data;
};



export const logoutRequest = async () => {
    const { data } = await api.post("/auth/logout");
    return data;
};




// Change Password Request
export const changePasswordRequest = async (passwords) => {
  // يتوقع الباك إند الحقول مثل currentPassword و newPassword
  const { data } = await api.post("/auth/change-password", passwords);
  return data;
};