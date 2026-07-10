// The "AI Tips and Guidelines" section displays a grid of tips.
// The logo color and title change according to the plant's condition.

import { CircleCheck, TriangleAlert } from "lucide-react";

const AITipsGrid = ({ isHealthy, tips }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Top row: Title + Status logo directly next to it */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-[#1B3D2F] font-bold text-xl">
          AI Tips and Guidelines
        </h2>

        {/* Status symbol: Green for healthy, Red for injured */}
        <span
          className={`text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 ${
            isHealthy ? "bg-green-600 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isHealthy ? (
            <>
              <CircleCheck />
              SYSTEM STATUS: OPTIMAL
            </>
          ) : (
            <>
              <TriangleAlert /> URGENT ACTION REQUIRED
            </>
          )}
        </span>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {tips.map((tip, index) => (
          <div key={index} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
              {tip.icon}
            </div>
            <div>
              <p className="text-gray-800 text-sm font-medium">{tip.title}</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                {tip.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AITipsGrid;
