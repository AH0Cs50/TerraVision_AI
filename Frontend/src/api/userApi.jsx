import api from "./axios";

// Get Profile
export const getProfile = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data.data;
};

// Update Profile
export const updateProfile = async (userId, payload) => {
  const response = await api.put(`/users/${userId}`, payload);
  return response.data;
};