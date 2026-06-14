import React from "react";
import Sidebar from "../../components/layout/Sidebar";
import { FlowerIcon, PlantCropIcon, TreeIcon } from "../../ui/Icons";
import DashboardHeader from "../../components/layout/DashboardHeader";

export default function AddPlant() {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Sidebar Section */}
      <Sidebar />

      {/*  Main Content  */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
        <DashboardHeader />

        {/* Form Container - Add New Plant */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
          <div className="w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-6 sm:p-10">
            {/* Form Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0A3D24]">
                Add New Plant
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Introduce a new species to your intelligent garden system.
              </p>
            </div>

            <form className="space-y-6">
              {/* Image Upload Box */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] hover:border-[#0A3D24] rounded-xl p-6 bg-[#F9FAFB] cursor-pointer transition">
                <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg shadow-sm text-[#6B7280]">
                  <svg
                    className="w-6 h-6 text-[#0A3D24]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                </div>
                <span className="text-xs font-medium text-[#4B5563] mt-3">
                  Upload Plant Image
                </span>
              </div>

              {/* Plant Type Selection (Radio Boxes) */}
              <div>
                <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider block mb-2">
                  Plant Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Option: Crop */}
                  <label className="border-2 border-[#0A3D24] bg-[#F4F7F5] rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <input
                      type="radio"
                      name="plant_type"
                      defaultChecked
                      className="sr-only"
                    />

                    <span className="text-lg">
                      <PlantCropIcon />{" "}
                    </span>

                    <span className="text-xs font-bold text-[#0A3D24] mt-1">
                      Crop
                    </span>
                  </label>
                  {/* Option: Tree */}
                  <label className="border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <input type="radio" name="plant_type" className="sr-only" />
                    <span className="text-lg">
                      <TreeIcon />
                    </span>
                    <span className="text-xs font-medium text-[#4B5563] mt-1">
                      Tree
                    </span>
                  </label>
                  {/* Option: Flower */}
                  <label className="border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <input type="radio" name="plant_type" className="sr-only" />
                    <span className="text-lg">
                      <FlowerIcon />
                    </span>
                    <span className="text-xs font-medium text-[#4B5563] mt-1">
                      Flower
                    </span>
                  </label>
                </div>
              </div>

              {/* Input: Common Name */}
              <div>
                <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider block mb-2">
                  Common Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., My Roma Tomato"
                  className="w-full px-4 py-3 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#0A3D24] transition placeholder-[#9CA3AF]"
                />
              </div>

              {/* Inputs: Planting Date & Sunlight Exposure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider block mb-2">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#0A3D24] transition text-[#4B5563]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider block mb-2">
                    Sunlight Exposure
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 6-8 hours daily"
                    className="w-full px-4 py-3 bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:bg-white focus:border-[#0A3D24] transition placeholder-[#9CA3AF]"
                  />
                </div>
              </div>

              {/* Soil Type Buttons */}
              <div>
                <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider block mb-2">
                  Soil Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Clay", "Sandy", "Loamy", "Organic"].map((soil, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`py-2 px-3 text-xs font-medium border rounded-xl transition ${idx === 2 ? "bg-[#111827] text-white border-[#111827]" : "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB] hover:bg-[#E5E7EB]"}`}
                    >
                      {soil}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Health Status */}
              <div>
                <label className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider block mb-2">
                  Initial Health Status
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#F3F4F6] p-1.5 rounded-xl border border-[#E5E7EB]">
                  <button
                    type="button"
                    className="py-2 px-4 text-xs font-bold bg-white text-[#0A3D24] shadow-sm rounded-lg transition"
                  >
                    Healthy
                  </button>
                  <button
                    type="button"
                    className="py-2 px-4 text-xs font-medium text-[#6B7280] hover:text-[#111827] transition"
                  >
                    Warning
                  </button>
                  <button
                    type="button"
                    className="py-2 px-4 text-xs font-medium text-[#6B7280] hover:text-[#111827] transition"
                  >
                    Critical
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  className="w-full bg-[#0A3D24] hover:bg-[#124629] text-white text-sm font-semibold py-3.5 rounded-xl shadow-sm transition active:scale-[0.99]"
                >
                  Add to Garden
                </button>
                <button
                  type="button"
                  className="w-full bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#111827] text-sm font-medium py-2 text-center transition"
                >
                  Cancel and Return
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
