import React from "react";
import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";
import WeatherPanel from "../../components/dashboard/WeatherPanel";
import { AI_CareIcon, MoistureOptimalIcon, SettingsIcon } from "../../ui/Icons";
import TomatoImage from "../../assets/Tomato.jpg";
import Zucchini from "../../assets/Zucchini.jpg";
import AiInsights from "../../components/dashboard/AiInsights";
import PlantCareTasks from "../../components/dashboard/PlantCareTasks";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content  */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
        <DashboardHeader />
        {/* Dashboard Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
          {/* hero section */}
          <div>
            <h2 className="text-2xl font-bold text-[#0A3D24]">
              Good Morning, Hussam
            </h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Your garden is waking up beautifully today. Here's your overview.
            </p>
          </div>

          {/* Green Weather and Stats Panel */}
          <WeatherPanel />
          <AiInsights />
          <PlantCareTasks />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
