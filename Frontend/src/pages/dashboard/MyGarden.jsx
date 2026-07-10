import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";
import Defail_Img from "../../assets/my_garden/garden_5.jpg";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

import { getUserPlants, getPlantById, deletePlant } from "../../api/plantsApi";

import { useAuthStore } from "../../store/authStore";

const MyGarden = () => {
  const [plants, setPlants] = useState([]);
  const token = useAuthStore((state) => state.token);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await getUserPlants();
        const list = response.data;

        const withImages = await Promise.all(
          list.map(async (plant) => {
            const plantId = plant.id || plant.uuid;
            if (!plant.coverImage || !plantId) return plant;
            try {
              const single = await getPlantById(plantId);
              return { ...plant, coverImageUrl: single.data.coverImageUrl };
            } catch {
              return plant;
            }
          }),
        );

        setPlants(withImages);
      } catch (error) {
        console.error("Error fetching plants:", error);
      }
    };

    fetchPlants();
  }, []);

  // Smart function to clean and repair corrupted image links from the backend
  const getPlantImage = (plant) => plant.coverImageUrl || null;

  // Delete plant
  const handleDeletePlant = async (e, plant) => {
    e.stopPropagation(); // Prevent the plant details page from opening when clicking the delete icon.

    const plantId = plant.uuid || plant.id;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${plant.name}"?`,
    );
    if (!confirmed) return;

    try {
      await deletePlant(plantId);
      setPlants((prev) => prev.filter((p) => (p.uuid || p.id) !== plantId));
    } catch (error) {
      console.error("Error deleting plant:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      {/* Sidebar */}
      <Sidebar activeTab="my-garden" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="My Garden" />

        <main className="flex-1 p-6 overflow-y-auto max-w-6xl mx-auto w-full">
          {/* Header section with Stats */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[#0A3D24]">
                My Crops
              </h1>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Monitor and manage your sustainable home garden
              </p>
            </div>
          </div>

          {/* Plant Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Add New Plant Tile */}
            <div
              onClick={() => navigate("/dashboard/add_plant")}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#0A3D24] bg-white cursor-pointer transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-[#0A3D24]/10 flex items-center justify-center transition-colors">
                <Plus />
              </div>
              <span className="text-sm font-semibold text-gray-500 group-hover:text-[#0A3D24] transition-colors">
                Add a new plant to your sector
              </span>
            </div>

            {plants.map((plant) => (
              <div
                key={plant.id || plant.uuid}
                onClick={() =>
                  navigate(
                    `/plant/${plant.hasDisease ? "infected" : "healthy"}/${plant.uuid || plant.id}`,
                  )
                }
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-48 w-full bg-gray-50 overflow-hidden">
                  <img
                    src={getPlantImage(plant) || Defail_Img}
                    alt={plant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {plant.hasDisease ? (
                      <span className="bg-red-50 text-red-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-red-100 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Sick
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Healthy
                      </span>
                    )}
                  </div>

                  {/* Delete Icon - only appears when hovering over the card */}
                  <button
                    onClick={(e) => handleDeletePlant(e, plant)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50"
                    title="Delete plant"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600 transition-colors" />
                  </button>
                </div>

                {/* Info Section */}
                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0A3D24] transition-colors truncate capitalize">
                        {plant.name}
                      </h3>
                      <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-md uppercase shrink-0">
                        {plant.category || "Crop"}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-400 mt-0.5 capitalize">
                      {plant.family?.replace("_", " ") || "Unknown Family"}
                    </p>

                    <p className="text-xs font-semibold text-gray-500 mt-2">
                      Growth Age: {plant.ageDays || 0} Days
                    </p>
                  </div>

                  {/* Footer Card */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-gray-400">
                        Stage:
                      </span>
                      <span className="text-xs font-bold text-gray-700 capitalize">
                        {plant.growthStage}
                      </span>
                    </div>
                    <span className="inline-flex items-center text-sm font-bold text-[#0A3D24] group">
                      Show Details
                      <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Section */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 pt-6 text-sm text-gray-400 font-medium gap-4">
            <div>
              Show: <span className="text-gray-600">{plants.length} Crops</span>
            </div>
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-[#0A3D24] font-bold">
                1
              </button>
              <button className="px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-500 transition">
                2
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyGarden;
