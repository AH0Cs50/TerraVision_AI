import React, { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/authStore";
import { validatePlant } from "../../validation/plantValidation";
import { Camera, ChevronDown } from "lucide-react";

import {
  Wheat,
  Trees,
  Flower2,
  HeartPulse,
  TriangleAlert,
  ShieldAlert,
  Sprout,
} from "lucide-react";

import {
  uploadUserImage,
  uploadImageToStorage,
  extractPlantData,
  createPlant,
} from "../../api/plantsApi";

export default function AddPlant() {
  const [name, setName] = useState("");

  const [lastWatered, setLastWatered] = useState("");

  const [plantType, setPlantType] = useState("crop");
  const [family, setFamily] = useState("");
  const [soilType, setSoilType] = useState("");
  const [growthStage, setGrowthStage] = useState("vegetative");
  const [plantedAt, setPlantedAt] = useState("");
  const [healthStatus, setHealthStatus] = useState("healthy");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  const [imageKey, setImageKey] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  // AI extracted information
  const [aiSummary, setAiSummary] = useState("");

  // The actual disease detection result coming from AI (hasDisease + stress)
  const [diseaseInfo, setDiseaseInfo] = useState(null);

  // Loading status during image upload and AI data extraction
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // this hoke useing only view image selected
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const PLANT_TYPES = [
    {
      value: "crop",
      label: "Crop",
      icon: Sprout,
    },
    {
      value: "tree",
      label: "Tree",
      icon: Trees,
    },
    {
      value: "flower",
      label: "Flower",
      icon: Flower2,
    },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const validationErrors = validatePlant({
      name,
      plantType,
      family,
      plantedAt,
      soil: { type: soilType },
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    setApiError("");

    try {
      const payload = {
        name,
        commonName: name,
        category: plantType,
        family,
        growthStage,
        lastWatered,
        plantedAt: plantedAt ? new Date(plantedAt).toISOString() : null,
        soil: {
          type: soilType,
          moisture: 60,
        },

        // Pass the S3 key to link it to the plant when it is created in the database
        coverImage: imageKey || null,

        // Correction: Send the actual detection result coming from the image analysis (diseaseInfo)
        ...(diseaseInfo && {
          stress: {
            diseaseType: diseaseInfo.diseaseType,
            severity: diseaseInfo.severity,
          },
        }),
      };
      await createPlant(payload, token);

      navigate("/dashboard/my_garden");
    } catch (error) {
      if (
        error.message.includes("expired") ||
        error.message.includes("Unauthorized")
      ) {
        setApiError("Your session has expired, please log in again.");
      } else {
        setApiError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // When the user manually selects a health status, we also update diseaseInfo
  const handleHealthStatusSelect = (status) => {
    setHealthStatus(status);
    setDiseaseInfo((prev) => ({
      hasDisease: status !== "healthy",
      diseaseType: status === "healthy" ? "none" : prev?.diseaseType || "none",
      severity: status,
    }));
  };

  const handleImageUpload = async (file) => {
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setDiseaseInfo(null);
    setIsAnalyzingImage(true);

    try {
      // Request a signed upload link from the backend
      const upload = await uploadUserImage(file.name, file.type, token);
      const s3Key = upload.data.key;
      const uploadUrl = upload.data.uploadUrl;

      // Upload the actual file to cloud storage S3
      await uploadImageToStorage(uploadUrl, file);

      // Save the key in the state for use when saving the plant
      setImageKey(s3Key);

      // Extracting plant data using artificial intelligence
      const result = await extractPlantData(s3Key, token);
      const plant = result.data;

      // Fix: The actual /image/extract response returns
      // { hasDisease, stress: { diseaseType, severity } }
      const severity = plant.stress?.severity; // "healthy" | "medium" | "critical"

      const mappedHealthStatus =
        severity === "critical"
          ? "critical"
          : severity === "medium"
            ? "warning"
            : "healthy";

      setPlantType(plant.category || "crop");
      setFamily(plant.family || "");
      setGrowthStage(plant.growthStage || "vegetative");
      setHealthStatus(mappedHealthStatus);
      setAiSummary(plant.summary || "");

      // We store the actual detection result to display it to the user as a clear alert
      setDiseaseInfo({
        hasDisease: Boolean(plant.hasDisease),
        diseaseType: plant.stress?.diseaseType || "none",
        severity: severity || "healthy",
      });
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-x-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto pl-12 pr-6 py-8 w-full bg-[#F9FAFB]">
          <div className="w-full bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-8 sm:p-12 lg:p-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-[#0A3D24] tracking-tight">
                Add New Plant
              </h2>
              <p className="text-base text-[#6B7280] mt-2">
                Introduce a new species to your intelligent garden system.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              {/* API Error */}
              {apiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                  {apiError}
                </div>
              )}

              {/* Image Upload Box */}
              <div className="space-y-2">
                {!preview ? (
                  <label
                    htmlFor="plant-image"
                    className="mx-auto w-[220px] h-[220px] border-2 border-dashed border-[#D1D5DB] rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white hover:border-[#0A3D24] transition"
                  >
                    <Camera className="w-10 h-10 text-[#0A3D24] mb-3" />
                    <span className="text-base font-semibold text-[#374151]">
                      Upload Plant Image
                    </span>
                  </label>
                ) : null}

                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="mx-auto w-[220px] h-[220px] rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white hover:border-[#0A3D24] transition"
                  />
                )}
                {selectedImage && (
                  <p className="mt-3 text-sm text-emerald-700 text-center">
                    {selectedImage.name}
                  </p>
                )}

                {isAnalyzingImage && (
                  <p className="mt-2 text-sm text-[#6B7280] text-center animate-pulse">
                    The image is being analyzed using artificial
                    intelligence...{" "}
                  </p>
                )}

                <input
                  type="file"
                  id="plant-image"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];

                    if (!file) return;

                    try {
                      await handleImageUpload(file);
                    } catch (error) {
                      setApiError(error.message);
                    }
                  }}
                />
              </div>

              {/* Plant Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Plant Type
                </label>

                <div className="grid grid-cols-3 gap-4">
                  {PLANT_TYPES.map((type) => {
                    const Icon = type.icon;

                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setPlantType(type.value)}
                        className={`rounded-xl border p-4 transition ${
                          plantType === type.value
                            ? "border-green-700 bg-green-50 text-green-700"
                            : "border-gray-200 bg-gray-50 hover:border-green-300"
                        }`}
                      >
                        <Icon className="mx-auto mb-2 h-7 w-7" />

                        <p>{type.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/*     Common Name */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Common Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Roma Tomato"
                  className={`w-full px-4 py-3.5 rounded-xl text-sm transition shadow-inner
                     ${
                       errors.name
                         ? "border border-red-500 bg-red-50"
                         : "bg-[#F3F4F6] border border-transparent"
                     }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              {(aiSummary || diseaseInfo) && (
                <div className="space-y-3">
                  {aiSummary && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                      <h3 className="font-semibold text-emerald-700 mb-2">
                        AI Summary
                      </h3>
                      <p className="text-sm text-gray-700">{aiSummary}</p>
                    </div>
                  )}

                  {diseaseInfo && (
                    <div
                      className={`rounded-xl border p-4 flex items-start gap-3 ${
                        diseaseInfo.hasDisease
                          ? "bg-red-50 border-red-200"
                          : "bg-emerald-50 border-emerald-200"
                      }`}
                    >
                      {diseaseInfo.hasDisease ? (
                        <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                      ) : (
                        <HeartPulse className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            diseaseInfo.hasDisease
                              ? "text-red-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {diseaseInfo.hasDisease
                            ? "تم اكتشاف إصابة محتملة في النبتة"
                            : "لم يتم اكتشاف أي إصابة — النبتة تبدو سليمة"}
                        </p>
                        {diseaseInfo.hasDisease && (
                          <p className="text-xs text-red-600 mt-1">
                            نوع الإصابة: {diseaseInfo.diseaseType} • الشدة:{" "}
                            {diseaseInfo.severity}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Plant Family
                </label>

                <div className="relative">
                  <select
                    value={family}
                    onChange={(e) => setFamily(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#F3F4F6] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0A3D24] transition shadow-inner pr-10 appearance-none"
                  >
                    <option value="">Select Plant Family</option>
                    <option value="leafy_greens">Leafy Greens</option>
                    <option value="fruiting_nightshade">
                      Fruiting Nightshade
                    </option>
                    <option value="succulent">Succulent</option>
                    <option value="root_crops">Root Crops</option>
                    <option value="brassicas">Brassicas</option>
                    <option value="legumes">Legumes</option>
                    <option value="herbs">Herbs</option>
                    <option value="tropical">Tropical</option>
                    <option value="citrus">Citrus</option>
                    <option value="vines">Vines</option>
                    <option value="grasses">Grasses</option>
                    <option value="flowering_ornamentals">
                      Flowering Ornamentals
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center ">
                    <ChevronDown className="w-4 h-4 text-gray-500 " />
                  </div>
                  {errors.family && (
                    <p className="mt-1 text-sm text-red-500">{errors.family}</p>
                  )}
                </div>
              </div>

              {/*   Soil Type */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Soil Type
                </label>

                <div className="relative">
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#F3F4F6] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0A3D24] transition shadow-inner pr-10 appearance-none"
                  >
                    <option value="">Select Soil Type</option>
                    <option value="sandy">Sandy</option>
                    <option value="alfisols">Alfisols</option>
                    <option value="aridisols">Aridisols</option>
                    <option value="entisols">Entisols</option>
                    <option value="inceptisols">Inceptisols</option>
                    <option value="vertisols">Vertisols</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <ChevronDown className="w-4 h-4 text-gray-500 " />
                  </div>
                  {errors.soilType && (
                    <p className="text-red-500 text-sm">{errors.soilType}</p>
                  )}
                </div>
              </div>

              {/* Growth Stage (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Growth Stage (Optional)
                </label>
                <div className="relative">
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#F3F4F6] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0A3D24] transition shadow-inner pr-10 appearance-none"
                  >
                    <option value="seedling">Seedling</option>
                    <option value="vegetative">Vegetative</option>
                    <option value="flowering">Flowering</option>
                    <option value="fruiting">Fruiting</option>
                    <option value="mature">Mature</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Planting Date - Last Watered */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    value={plantedAt}
                    onChange={(e) => setPlantedAt(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#F3F4F6] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0A3D24] transition shadow-inner"
                  />
                  {errors.plantedAt && (
                    <p className="text-red-500 text-sm">{errors.plantedAt}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    Last Watered
                  </label>
                  <input
                    type="text"
                    value={lastWatered}
                    onChange={(e) => setLastWatered(e.target.value)}
                    placeholder="e.g., 2 hours ago"
                    className="w-full px-4 py-3.5 bg-[#F3F4F6] border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0A3D24] transition shadow-inner"
                  />
                </div>
              </div>

              {/* Initial Health Status */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Initial Health Status
                </label>
                <div className="bg-[#F3F4F6] p-1.5 rounded-xl grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleHealthStatusSelect("healthy")}
                    className={`py-3 px-4 text-sm rounded-lg transition ${
                      healthStatus === "healthy"
                        ? "bg-white text-[#0A3D24] border border-[#0A3D24]/20 shadow-sm font-bold"
                        : "text-[#6B7280]"
                    }`}
                  >
                    Healthy
                  </button>

                  <button
                    type="button"
                    onClick={() => handleHealthStatusSelect("warning")}
                    className={`py-3 px-4 text-sm rounded-lg transition ${
                      healthStatus === "warning"
                        ? "bg-white text-yellow-600 border shadow-sm font-bold"
                        : "text-[#6B7280]"
                    }`}
                  >
                    Warning
                  </button>

                  <button
                    type="button"
                    onClick={() => handleHealthStatusSelect("critical")}
                    className={`py-3 px-4 text-sm rounded-lg transition ${
                      healthStatus === "critical"
                        ? "bg-white text-red-600 border shadow-sm font-bold"
                        : "text-[#6B7280]"
                    }`}
                  >
                    Critical
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting || isAnalyzingImage}
                  className={`w-full text-white text-base font-semibold py-4 rounded-xl shadow-md transition
                  ${
                    isSubmitting || isAnalyzingImage
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#0A3D24] to-[#1E5E3A] hover:opacity-95 active:scale-[0.99]"
                  }`}
                >
                  {isSubmitting ? "Adding Plant..." : "Add to Garden"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#111827] text-sm font-semibold py-2 text-center transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
