import api from "./axios";
import axios from "axios";

export const scanGeneralPlant = async (file, token) => {
  // 1. Generate Signed URL
  const { data: upload } = await api.post(
    "/plants/user/image/upload",
    {
      fileName: file.name,
      fileType: file.type,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // 2. Upload image
  await axios.put(upload.data.uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });

  // 3. Extract data
  const { data: extracted } = await api.post(
    "/plants/image/extract",
    {
      key: upload.data.key,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const plant = extracted.data;

  return {
    disease: plant.hasDisease
      ? plant.stress?.diseaseType || "Disease"
      : "healthy",

    plant: plant.family || "unknown",

    confidence: 1,

    hasDisease: Boolean(plant.hasDisease),

    severity: plant.stress?.severity || "healthy",

    summary: plant.summary || "",
  };
};