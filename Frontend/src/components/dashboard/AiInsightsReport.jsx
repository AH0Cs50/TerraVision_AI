import React from "react";
import { DiagIcon } from "../../icons/CustomIcons";
import { CircleCheck } from "lucide-react";

const AiInsightsReport = ({ report }) => {
  const summary = report?.aiReport?.summary ?? "No AI report available.";

  const recommendations = report?.aiReport?.recommendations ?? [];

  return (
    <div className="w-full bg-gradient-to-br from-[#064e3b] to-[#022c22] text-white rounded-2xl shadow-xl overflow-hidden border border-[#047857]/30">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/*  Left side: Executive Report  */}
        <div className="p-8 lg:p-10 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <DiagIcon size="20" />
            </div>
            <h3 className="text-xl font-bold tracking-wide">
              AI Executive Farm Report
            </h3>
          </div>

          <p className="text-emerald-100/90 text-base leading-relaxed font-normal max-w-xl">
            {summary}
          </p>
        </div>

        {/* Right side: Recommendations */}
        <div className="p-8 lg:p-10 bg-black/5 flex flex-col justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400/80 mb-4 block">
            Critical Recommendations
          </span>

          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-emerald-100">
                No recommendations available.
              </p>
            ) : (
              recommendations.map((text, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-md transition-all hover:bg-white/[0.06]"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <CircleCheck />
                  </div>

                  <p className="text-sm text-emerald-50/90 leading-normal font-medium">
                    {text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiInsightsReport;
