import { BadgeCheck, ClipboardCheck, Microscope, ShieldCheck } from "lucide-react";

const DiseaseAnalysis = ({
  confidence,
  isHealthy = false,
  detectedIssue,
  scientificName,
  symptoms,
  recommendation,
}) => {
  // تجميع الحالات الشرطية في كائن واحد لمنع تكرار الشروط بالأسفل
  const config = {
    bgLight: isHealthy ? "bg-green-50" : "bg-red-50",
    strokeMain: isHealthy ? "#2D6A4F" : "#EF4444",
    title: isHealthy ? "AI Health Analysis" : "AI Disease Analysis",
    issueColor: isHealthy ? "text-green-700" : "text-red-700",
    recTextColor: isHealthy ? "text-[#2D6A4F]" : "text-[#BA1A1A]",
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Microscope icon - red for infected, green for healthy */}
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${config.bgLight}`}
          >
            <Microscope stroke={config.strokeMain} className="" />
          </div>
          {/* the address */}
          <h2 className="text-gray-900 font-bold text-lg">{config.title}</h2>
        </div>
        <span className="text-[11px] text-gray-600 border border-gray-200 px-3 py-1 rounded-full font-semibold">
          {confidence} CONFIDENCE
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col sm:flex-row gap-5 flex-1">
        {/* Left: Detected Issue + Symptoms */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Detected Issue */}
          <div className="pb-4 border-b border-gray-100">
            <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-2">
              DETECTED ISSUE
            </p>

            <p
              className={`font-black text-3xl leading-tight capitalize ${config.issueColor}`}
            >
              {detectedIssue}
            </p>

            {scientificName && (
              <p className="text-gray-400 text-sm mt-1 italic">
                {scientificName}
              </p>
            )}
            {isHealthy && (
              <p className="text-gray-400 text-sm mt-1">(No Issues Detected)</p>
            )}
          </div>

          {/* Symptom Breakdown */}
          <div>
            <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3">
              SYMPTOM BREAKDOWN
            </p>
            <div className="flex flex-col gap-2">
              {symptoms.map((symptom, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 w-fit"
                >
                  <ShieldCheck stroke={config.strokeMain} />
                  <span className="text-gray-700 text-sm font-medium">
                    {symptom}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Recommendation */}
        <div className="sm:w-72 rounded-2xl p-5 flex flex-col gap-3 shrink-0 bg-[#EEF2EF] border border-[#DDE8DF]">
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <BadgeCheck className="text-[#2D6A4F]" />
            ) : (
           
              <ClipboardCheck className="text-[#BA1A1A]" />
            )}
            <p
              className={`text-[15px] font-black tracking-widest uppercase ${config.recTextColor}`}
            >
              AI RECOMMENDATION
            </p>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiseaseAnalysis;
