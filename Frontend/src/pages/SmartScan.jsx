import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import Smart_scan_img from "../assets/smart_scan/smart_scan.png";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";
import { scanGeneralPlant } from "../api/smartScanApi";
import { Camera, Leaf, Sparkles, TriangleAlert } from "lucide-react";

const SmartScan = () => {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mutation = useMutation({
    mutationFn: (file) => scanGeneralPlant(file, token),

    onSuccess: (result) => {
      setResult(result);
    },

    onError: (err) => {
      console.error(err);
    },
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  return (
    <div className="flex min-h-screen bg-[#f9fafb] text-[#1f2937]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        {/* Main Body (Internal Page Body)*/}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8 overflow-y-auto">
          {/* Page title and description */}
          <div>
            <h2 className="text-2xl font-bold text-[#0a3622]">Smart Scan</h2>
            <p className="text-sm text-gray-500 mt-1">
              Capture or upload to identify crop health and receive AI insights.
            </p>
          </div>

          {/* Image Upload Zone */}
          <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-white p-12 flex flex-col items-center justify-center text-center shadow-xs min-h-[400px]">
            {!preview ? (
              <div
                onClick={() => document.getElementById("plant-image").click()}
                className="cursor-pointer w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100"
              >
                <Camera className="text-[#012D1D] h-10 w-10" />
              </div>
            ) : null}

            {preview && (
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
            <h3 className="text-base font-semibold text-gray-800">
              Capture Live Photo or Upload Plant Image
            </h3>
            <p className="text-xs text-gray-400 mt-1 mb-6">
              Drag and drop files here or click to browse
            </p>

            <input
              type="file"
              id="plant-image"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];

                if (!file) return;

                setSelectedImage(file);
                setPreview(URL.createObjectURL(file));
                setResult(null);
              }}
            />
            {/* Analyzing button */}
            <div className="flex justify-center w-full">
              <button
                className="flex items-center gap-2 bg-[#0a3622] hover:bg-[#0f462d] text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                disabled={
                  !selectedImage || mutation.isPending || (result && preview)
                }
                onClick={() => mutation.mutate(selectedImage)}
              >
                <Sparkles className="w-4 h-4" />
                {mutation.isPending ? "Analyzing..." : "Analyze Image"}
              </button>
            </div>
          </div>

          {/* AI Diagnosis Summary */}
          {result && (
            <div
              className={`mt-8 rounded-2xl border p-6 transition-all duration-300 ${
                !result.hasDisease
                  ? "border-emerald-300 bg-white"
                  : "border-red-300 bg-white"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left */}
                <div className="flex gap-5">
                  <div
                    className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl ${
                      result.disease === "healthy"
                        ? "bg-emerald-100"
                        : "bg-red-100"
                    }`}
                  >
                    {result.disease === "healthy" ? (
                      <Leaf className="text-emerald-900" />
                    ) : (
                      <TriangleAlert className="text-yellow-500" />
                    )}
                  </div>

                  <div>
                    <h2
                      className={`text-3xl font-bold ${
                        result.disease === "healthy"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {result.disease === "healthy"
                        ? "Healthy Plant"
                        : "Disease Detected"}
                    </h2>

                    <p className="text-gray-500 mt-1">
                      {result.disease === "healthy"
                        ? "No disease was detected."
                        : "The AI detected symptoms that require attention."}
                    </p>

                    {/* Info */}
                    <div className="flex flex-wrap gap-6 mt-5">
                      <div>
                        <p className="text-xs uppercase text-gray-400">Plant</p>
                        <p className="font-semibold text-lg">
                          {result.plant === "unknown"
                            ? "Not Identified"
                            : result.plant}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400">
                          Disease
                        </p>
                        <p
                          className={`font-semibold text-lg ${
                            result.disease === "healthy"
                              ? "text-emerald-700"
                              : "text-red-700"
                          }`}
                        >
                          {result.hasDisease ? result.disease : "Healthy"}{" "}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-gray-400">
                          Confidence
                        </p>
                        <p className="font-semibold text-lg">
                          {(Number(result.confidence || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => navigate("/dashboard/my_garden")}
                    className="border border-[#0a3622] text-[#0a3622] px-6 py-3 rounded-xl font-semibold hover:bg-[#0a3622] hover:text-white transition"
                  >
                    + Add to Garden
                  </button>

                  <span className="text-xs text-gray-400">
                    Powered by TerraVision AI
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <div
                className={`mt-6 rounded-xl p-4 ${
                  result.disease === "healthy" ? "bg-emerald-50" : "bg-red-50"
                }`}
              >
                <h4
                  className={`font-semibold mb-2 ${
                    result.disease === "healthy"
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  AI Recommendation
                </h4>

                <p className="text-gray-600 leading-7">
                  {result.disease === "healthy"
                    ? "Your plant appears healthy. Add it to your Garden to receive watering reminders, growth tracking, and continuous AI monitoring."
                    : "Disease symptoms were detected. Add this plant to your Garden to receive treatment recommendations, reminders, and continuous AI monitoring."}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SmartScan;
