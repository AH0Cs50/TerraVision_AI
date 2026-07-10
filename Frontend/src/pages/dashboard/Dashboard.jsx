import TomatoImage from "../../assets/Tomato.jpg";
import Zucchini from "../../assets/Zucchini.jpg";

import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";
import WeatherPanel from "../../components/dashboard/WeatherPanel";

import FarmDashboardOverview from "../../components/dashboard/overview/FarmDashboardOverview";
import AiInsightsReport from "../../components/dashboard/AiInsightsReport";
import FarmActivitiesAndHarvest from "../../components/dashboard/FarmActivitiesAndHarvest";

import { getWeatherRequest } from "../../api/dashboardApi";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../api/dashboardApi";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.firstName || user?.name || "there";

  const {
    data: weatherData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["weatherData"],
    queryFn: getWeatherRequest,
    refetchInterval: 1000 * 60 * 15,
  });

  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const data = dashboard.data;

  if (dashboard.isLoading) {
    return <div className="flex justify-center py-10">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
        <DashboardHeader />

        {/* Dashboard Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 w-full bg-[#F9FAFB]">
          <div className="max-w-6xl mx-auto w-full space-y-8">
            {/* Hero Section */}
            <div>
              <h2 className="text-2xl font-bold text-[#0A3D24]">
                Good Morning, {firstName}
              </h2>
              <p className="text-sm text-[#6B7280] mt-0.5">
                Your garden is waking up beautifully today. Here's your
                overview.
              </p>
            </div>

            {/* 1-Weather Panel */}
            <WeatherPanel data={weatherData} />

            {/* 2-The second component (statistics) */}
            <FarmDashboardOverview dashboard={data} />

            {/* 3-The third component (Smart Report)*/}

            <AiInsightsReport report={data} />

            {/* 4-Component Four (Activities and Harvesting)*/}
            <FarmActivitiesAndHarvest
              harvest={data?.upcomingHarvests}
              activity={data?.recentActivity}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
