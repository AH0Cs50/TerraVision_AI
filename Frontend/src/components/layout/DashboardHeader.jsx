import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { Settings, BellDot } from "lucide-react";
import { logoutRequest } from "../../api/authApi";

const DashboardHeader = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } finally {
      logout();

      navigate("/login");
    }
  };

  return (
    <header className="h-16 border-b border-[#E5E7EB] bg-white px-6 flex items-center justify-between shrink-0">
      <div className="md:hidden font-bold text-[#0A3D24]">TerraVision AI</div>

      <div className="hidden md:block"></div>

      <div className="flex items-center space-x-4 ">
        <button className="text-[#6B7280] hover:text-[#111827] p-1">
          <Settings className="text-gray-700" />
        </button>

        <button className="text-[#6B7280] hover:text-[#111827] p-1 relative">
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          <BellDot className="text-gray-700" />
        </button>

        <div className="relative flex items-center space-x-3 pl-2 border-l border-[#E5E7EB]">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2"
          >
            <span className="text-sm font-medium text-[#374151] hidden sm:inline">
              {user?.name}
            </span>

            <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-40 bg-white border rounded-lg shadow-lg z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
