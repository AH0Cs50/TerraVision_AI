import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";

import { LayoutDashboard, Leaf, ScanLine, Settings } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard />,
      end: true, // مهم
    },
    {
      title: "My Crops",
      path: "/dashboard/my_garden",
      icon: <Leaf />,
      end: false,
    },
    {
      title: "Smart Scan",
      path: "/smart_scan",
      icon: <ScanLine />,
      end: false,
    },
    {
      title: "Settings",
      path: "/user/Settings",
      icon: <Settings />,
      end: false,
    },
  ];

  return (
    <>
      <aside className="w-64 bg-gradient-to-b from-[#23533e] via-[#123326] to-[#04140B] text-[#E7F0EC] flex flex-col justify-between p-6 hidden md:flex shrink-0 shadow-xl">
        <div>
          {/* Logo Section */}
          <div className="mb-10">
            <Link to="/login">
              <h1 className="text-xl font-bold tracking-wide text-white cursor-pointer">
                TerraVision AI
              </h1>
            </Link>

            <p className="text-xs text-[#84A996] tracking-wider uppercase mt-1">
              Your Plant Assistant
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition
        ${
          isActive
            ? "bg-black text-white"
            : "text-[#A3BFB0] hover:bg-[#124629]/20 hover:text-white"
        }`
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="text-xs text-[#84A996]/50 border-t border-[#124629]/20 pt-4">
          v1.0.0 © TerraVision
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
