import { ChartNoAxesCombined } from "lucide-react";

const GrowthStage = ({ plantAge, harvestEst, growthPercent, description }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-5 h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 font-bold text-lg">Growth Stage</h2>
        <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
         <ChartNoAxesCombined  className="text-[#2D6A4F]" />
        </div>
      </div>

      {/* Plant Age & Harvest Est */}
      <div className="flex items-stretch border-b border-gray-100 pb-5">
        <div className="flex-1">
          <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">PLANT AGE</p>
          <p className="text-gray-900 font-black text-2xl">{plantAge}</p>
        </div>
        <div className="w-px bg-gray-200 mx-4" />
        <div className="flex-1">
          <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">HARVEST EST.</p>
          <p className="text-gray-900 font-black text-2xl">{harvestEst}</p>
        </div>
      </div>

      {/* Growth Stage Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">GROWTH STAGE</span>
          <span className="flex items-center gap-1.5 bg-green-50 text-green-800 text-[10px] font-bold px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            ON TRACK
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${growthPercent}%` }}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default GrowthStage;