import React from "react";
import { AI_CareIcon, MoistureOptimalIcon, HealthyIcon, LightOptimalIcon } from "../../ui/Icons";
import TomatoImage from "../../assets/Tomato.jpg";

const AiInsights = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* الكرت الأول: AI Care Insights */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-[#111827] uppercase tracking-wider flex items-center space-x-1.5">
          <AI_CareIcon />
          <span>AI Care Insights</span>
        </h3>
        <div className="space-y-3">
          {[1, 2].map((_, i) => (
            <div key={i} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-[#E7F0EC] p-2 rounded-xl text-emerald-700 text-lg shrink-0">💧</div>
                <div>
                  <h4 className="text-xs font-bold text-[#374151]">Moisture Levels Optimal</h4>
                  <p className="text-[10px] text-[#6B7280]">Sector A1-A4 showing ideal root zone hydration.</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold shrink-0">2m ago</span>
            </div>
          ))}
        </div>
      </div>

      {/* الكرت الثاني: تفاصيل نبات الطماطم والمؤشرات الثلاثية */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center space-x-3 border-b border-[#F3F4F6] pb-3">
          <img className="w-10 h-10 rounded-xl object-cover shadow-inner" src={TomatoImage} alt="Tomato" />
          <div>
            <h3 className="text-xs font-black text-[#111827]">Heirloom Tomato</h3>
            <p className="text-[10px] text-[#6B7280] font-semibold">Nightshade Family • Sector A1</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "MOISTURE", val: "Optimal", icon: <MoistureOptimalIcon /> },
            { label: "HEALTH", val: "Healthy", icon: <HealthyIcon /> },
            { label: "LIGHT", val: "Optimal", icon: <LightOptimalIcon /> }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <div className="text-emerald-700">{item.icon}</div>
              <span className="text-[#6B7280] text-[8px] uppercase font-bold mt-1 tracking-wider">{item.label}</span>
              <strong className="text-[#0A3D24] text-xs font-black block mt-0.5">{item.val}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiInsights;