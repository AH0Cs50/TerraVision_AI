import React from "react";
import {
  DashboardIcon,
  CropsIcon,
  SmartScanIcon,
  DiagIcon,
} from "../../ui/Icons";
 
const Sidebar = () => {
  return (
    <>
      {/*  Sidebar */}
      <aside className="w-64 bg-gradient-to-r from-[#155528] to-[#10341c] text-[#E7F0EC] flex flex-col justify-between p-6 hidden md:flex shrink-0">
        <div>
          {/* Logo Section */}
          <div className="mb-10">
            <h1 className="text-xl font-bold tracking-wide text-white">
              TerraVision AI
            </h1>
            <p className="text-xs text-[#84A996] tracking-wider uppercase mt-1">
              Your Plant Assistant
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <a
              href="#dashboard"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-[#052e17] text-white font-medium transition"
            >
              <DashboardIcon />

              <span>Dashboard</span>
            </a>

            <a
              href="#crops"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#124629] text-[#A3BFB0] hover:text-white transition"
            >
              <CropsIcon /> <span>My Crops</span>
            </a>

            <a
              href="#scan"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#124629] text-[#A3BFB0] hover:text-white transition"
            >
              <SmartScanIcon />
              <span>Smart Scan</span>
            </a>

            <a
              href="#advice"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-[#124629] text-[#A3BFB0] hover:text-white transition"
            >
              <DiagIcon /> <span>AI Advice</span>
            </a>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="text-xs text-[#84A996] border-t border-[#124629] pt-4">
          v1.0.0 © TerraVision
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
