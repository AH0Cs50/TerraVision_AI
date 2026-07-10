// src/validation/plantValidation.js

export const validatePlant = (data) => {
  const errors = {};




/*   if (!data.image) {
  errors.image = "Please upload a plant image";
} */

  // Plant Name
  if (!data.name?.trim()) {
    errors.name = "Plant name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Plant name must be at least 2 characters";
  }

  // Plant Type
  if (!data.plantType) {
    errors.plantType = "Please select a plant type";
  }

  // Family
  if (!data.family) {
    errors.family = "Please select a plant family";
  }

  // Planting Date
  if (!data.plantedAt) {
    errors.plantedAt = "Planting date is required";
  }

  // Soil Type
  if (!data.soil?.type) {
    errors.soilType = "Please select a soil type";
  }

  return errors;
};