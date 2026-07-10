 import api from "./axios";

// Upload user image
export const uploadUserImage = async (fileName, fileType) => {
  try {
    const response = await api.post("/plants/user/image/upload", { fileName, fileType });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to generate upload URL.");
  }
};

// Upload the image directly to cloud storage
export const uploadImageToStorage = async (uploadUrl, file) => {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) throw new Error(await response.text());
  return true;
};

// Extracting plant data using artificial intelligence
export const extractPlantData = async (key) => {
  const { data } = await api.post("/plants/image/extract", { key });
  return data;
};

// Creating a new plant
export const createPlant = async (plantData, token) => {
  const { data } = await api.post("/plants", plantData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};

// Bring all plants of the current user
export const getUserPlants = async () => {
  const { data } = await api.get("/plants");
  return data;
};

// Bring a specific plant via ID
export const getPlantById = async (plantId) => {
  const { data } = await api.get(`/plants/${plantId}`);
  return data;
};

// Plant data update
export const updatePlant = async (plantId, plantData) => {
  const { data } = await api.put(`/plants/${plantId}`, plantData);
  return data;
};






// Delete plant
export const deletePlant = async (plantId) => {
  const { data } = await api.delete(`/plants/${plantId}`);
  return data;
};

// Upload a picture of a specific plant
export const uploadPlantImage = async (plantId, fileName, fileType) => {
  const { data } = await api.post(`/plants/${plantId}/image/upload`, { fileName, fileType });
  return data;
};

// Disease testing of a specific plant
/* export const detectDisease = async (plantId, key) => {
  const { data } = await api.post(`/plants/${plantId}/detect`, { key });
  return data;
}; */
export const detectDisease = async (plantId, key) => {
  const { data } = await api.put(`/plants/${plantId}/detect`, { key });
  return data;
};
// Remove plant image from gallery
export const removePlantImage = async (plantId, key) => {
  const { data } = await api.delete(`/plants/${plantId}/images`, { data: { key } });
  return data;
};