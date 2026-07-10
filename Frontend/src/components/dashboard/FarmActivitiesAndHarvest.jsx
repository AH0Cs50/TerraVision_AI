import { CalendarDays, Activity, History } from "lucide-react"; //
import React from "react";

const FarmActivitiesAndHarvest = ({ harvest = [], activity = [] }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full bg-[#F8FAF9]">
      {/*  Upcoming Harvest  */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAECEB] w-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#0B311E]">
              Upcoming Harvest
            </h3>

            <CalendarDays className="text-[#113322]" />
          </div>

          <div className="relative pl-9 space-y-4">
            <div className="absolute left-[16px] top-4 bottom-4 w-0 border-l-2 border-dashed border-[#D2D7D5]"></div>

            {harvest.map((item, index) => {
              const formattedDate = item.expectedHarvestDate
                ? new Date(item.expectedHarvestDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )
                : "N/A";

              return (
                <div
                  key={item.uuid || index}
                  className="relative flex items-center w-full"
                >
                  <div className="absolute left-[-35px] flex items-center justify-center w-8 h-8 z-10">
                    {index === 0 ? (
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-[#0A3D24] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#0A3D24]"></div>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#E6EBE9] border border-[#C3CDDB] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8A9A9F]"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full bg-[#F4F6F5] rounded-xl p-4 border border-[#EAECEB] min-h-[96px]">
                    <div className="flex flex-col justify-center">
                      <h4 className="text-base font-bold text-[#111827] leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[10px] font-bold text-[#9CA3AF] tracking-wider mt-1 uppercase">
                        MATURITY: {formattedDate}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider text-white bg-[#022C16] px-3 py-2 rounded-lg flex-shrink-0">
                      {item.daysUntilHarvest} DAYS LEFT
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/*  Recent Activity  */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EAECEB] w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#0B311E]">Recent Activity</h3>

          <History />
        </div>

        <div className="space-y-4">
          {activity.slice(0, 3).map((log, index) => {
            const isWater =
              log.description?.toLowerCase().includes("water") ||
              log.description?.toLowerCase().includes("irrigat");

            const formattedTime = log.createdAt
              ? new Date(log.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }) + " • TODAY"
              : "TODAY";

            return (
              <div
                key={log.logId || index}
                className="flex items-center gap-4 w-full"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border flex-shrink-0 
                  ${isWater ? "bg-[#E0F2FE] border-[#BAE6FD]" : "bg-[#E2F1EB] border-[#C4E3D5]"}`}
                >
                  <Activity />
                </div>

                <div className="flex-1 bg-[#F4F6F5] rounded-xl p-4 border border-[#EAECEB] min-h-[96px] flex flex-col justify-center">
                  <h4 className="text-base font-bold text-[#111827] leading-tight">
                    {log.description}
                  </h4>
                  <p className="text-[10px] font-bold text-[#9CA3AF] tracking-wider mt-0.5 uppercase">
                    {formattedTime}
                  </p>
                  {log.metadata?.plantName && (
                    <p className="text-xs font-semibold text-[#4B5563] mt-1 bg-[#EAEFEF] px-2 py-0.5 rounded-md w-fit border border-[#D5E0DF]">
                      ({log.metadata.plantName})
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FarmActivitiesAndHarvest;
