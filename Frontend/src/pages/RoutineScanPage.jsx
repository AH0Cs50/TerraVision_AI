import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/layout/DashboardHeader";

import {
  uploadPlantImage,
  uploadImageToStorage,
  detectDisease,
  updatePlant,
} from "../api/plantsApi";
import { Camera, CloudCheck, Sparkles } from "lucide-react";

const RoutineScanPage = () => {
  // uuid The plant comes from the page link: /plant/routine-scan/:uuid on the page */}
  const { uuid } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // All logic for lifting + checking + updating the cover image is contained within a single mutation
  const scanMutation = useMutation({
    mutationFn: async (file) => {
      // 1. Link to a website dedicated to this plant
      const uploadResponse = await uploadPlantImage(uuid, file.name, file.type);
      const { uploadUrl, key } = uploadResponse.data;

      // 2. Upload the actual image directly to S3
      await uploadImageToStorage(uploadUrl, file);

      // 3. Examine the disease on the uploaded image
      const detectResponse = await detectDisease(uuid, key);
      // 4. Update the plant cover image to become the new image (reflected in the garden)
      await updatePlant(uuid, { coverImage: key });

      return detectResponse.data; // { disease: { name, confidence }, diseaseHistory }
    },

    onSuccess: (data) => {
      // Cancel the cash for this plant and the garden list together
      queryClient.invalidateQueries({ queryKey: ["plant", uuid] });
      queryClient.invalidateQueries({ queryKey: ["plants"] });

      const isHealthy = data?.disease?.name === "healthy";

      setTimeout(() => {
        navigate(`/plant/${isHealthy ? "healthy" : "infected"}/${uuid}`);
      }, 1500);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAnalyze = () => {
    if (!selectedImage) return;
    scanMutation.mutate(selectedImage);
  };

  const isLoading = scanMutation.isPending;
  const result = scanMutation.data;
  const error = scanMutation.error;

  return (
    <div className="flex min-h-screen bg-[#f9fafb] text-[#1f2937]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8 overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold text-[#0a3622]">
              Routine Health Scan
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Start a new diagnostic scan to update your health metrics and
              verify progress.
            </p>
          </div>

          {/* Image Upload Box */}
          <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-white p-12 flex flex-col items-center justify-center text-center shadow-xs min-h-[400px]">
            {!preview ? (
              <div
                onClick={() => document.getElementById("plant-image").click()}
                className="cursor-pointer w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100"
              >
                <Camera className="text-[#012D1D] h-10 w-10" />
              </div>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="mt-5 w-56 rounded-xl border"
              />
            )}

            {selectedImage && (
              <p className="mt-3 text-sm text-emerald-700">
                {selectedImage.name}
              </p>
            )}

            <h3 className="text-lg font-semibold text-gray-800">
              Capture Live Photo or Upload Plant Image
            </h3>
            <p className="text-xs text-gray-400 mt-1 mb-8">
              Drag and drop files here or click to browse
            </p>

            <input
              type="file"
              id="plant-image"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              disabled={isLoading || !selectedImage}
              onClick={handleAnalyze}
              className="flex items-center gap-2 bg-[#0a3622] hover:bg-[#0f462d] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? "Analyzing..." : "Update Plant Details"}
            </button>

            {result && !error && (
              <p className="mt-4 text-sm font-medium text-emerald-700">
                {result.disease?.name === "healthy" ? (
                  <div className="flex p-2 text-emerald-700">
                    <CloudCheck className=" mr-2" />
                    <span>
                      Scan complete: No disease detected. Redirecting...
                    </span>
                  </div>
                ) : (
                  `⚠️ Scan complete: ${result.disease?.name} detected (${Math.round(
                    (result.disease?.confidence || 0) * 100,
                  )}% confidence). Redirecting...`
                )}
              </p>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-600 font-medium">
                {error.message || "Scan failed. Please try again."}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoutineScanPage;
