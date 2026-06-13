import React from "react";

import Plant from "../../assets/empty_dashboard_img.png";
import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";

// bg-gradient-to-r from-[#2e9d4f] to-[#143d22]

export default function EmptyDashboard() {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/*  Main Content Area  */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
<DashboardHeader />

        {/* Empty State Content Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-4xl bg-white border border-[#E5E7EB] rounded-2xl shadow-sm px-6 py-12 sm:py-20 flex flex-col items-center text-center">
            {/* Welcoming Text */}
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3D24] tracking-tight">
              Good Morning, Hussam
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] mt-2 max-w-md">
              Your garden is waking up beautifully today. Here's your overview.
            </p>

            {/* Center Art/Image Container */}
            <div className="my-8 w-56 h-56 sm:w-64 sm:h-64 bg-gradient-to-b from-[#F3F4F6] to-[#E5E7EB] rounded-full flex items-center justify-center p-4 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[#0A3D24]/5 opacity-40 rounded-sm blur-xl"></div>
              {/* Plant Image Mockup */}
              <img
                src={Plant}
                alt="Empty Garden Plant Illustration"
                className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-2xl shadow-md transform rotate-1 hover:rotate-0 transition duration-300"
              />
            </div>

            {/* Bottom Call to Action Section */}
            <h3 className="text-xl font-bold text-[#111827]">
              Your Garden is Ready to Grow
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-2 max-w-md px-4">
              Start monitoring your plants with AI-powered insights. Add your
              first plant to begin tracking health, moisture, and disease scans.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-6">
              <button className="bg-[#0A3D24] hover:bg-[#124629] text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition active:scale-95">
                <span className="text-lg font-bold">+</span>
                <span>Add Your First Plant</span>
              </button>

              <button className="bg-white hover:bg-[#F9FAFB] text-[#374151] text-sm font-semibold px-6 py-3 rounded-xl border border-[#D1D5DB] shadow-sm flex items-center justify-center space-x-2 transition active:scale-95">
                {/* Explore Icon Placeholder */}
                <svg
                  className="w-4 h-4 text-[#6B7280]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                </svg>
                <span>Explore Sample Data</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
