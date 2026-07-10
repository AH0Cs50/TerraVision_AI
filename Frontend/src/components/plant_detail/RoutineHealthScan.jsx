import { RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RoutineMonitoring } from "../../icons/CustomIcons";

const RoutineHealthScan = ({ plant }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Microscope icon*/}
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
          <RoutineMonitoring />
        </div>
        <div>
          <p className="text-gray-800 font-semibold text-sm">
            Routine Health Scans
          </p>
          <p className="text-gray-500 text-xs">
            Initiate a new diagnostic scan to update real-time health metrics
            and verify remediation progress.
          </p>
        </div>
      </div>
      {/* Start Scan Button */}{" "}
      <button
        onClick={() => navigate(`/plant/routine-scan/${plant.uuid}`)}
        className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap hover:bg-gray-50 transition-colors"
      >
        ↻ START NEW SCAN
      </button>
    </div>
  );
};

export default RoutineHealthScan;
