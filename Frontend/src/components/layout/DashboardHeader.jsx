import React from "react";
import { SettingsIcon, NotificationIcon } from "../../ui/Icons";

const DashboardHeader = () => {
  return (
    <>
      {" "}
      <header className="h-16 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between shrink-0">
        <div className="md:hidden font-bold text-[#0A3D24]">TerraVision AI</div>
        <div className="hidden md:block"></div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          <button className="text-[#6B7280] hover:text-[#111827] p-1">
            <SettingsIcon />
          </button>

          <button className="text-[#6B7280] hover:text-[#111827] p-1 relative">
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>

            <NotificationIcon />
          </button>
          <div className="flex items-center space-x-3 pl-2 border-l border-[#E5E7EB]">
            <span className="text-sm font-medium text-[#374151] hidden sm:inline">
              Hussam..
            </span>
            <div className="w-8 h-8 rounded-full bg-[#145330] text-white flex items-center justify-center text-xs font-bold">
              H
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default DashboardHeader;
