import React from "react";
import {
  AI_CareIcon,
  MoistureOptimalIcon,
  SettingsIcon,
  NeedsFeed,
  HealthyIcon,
  LightOptimalIcon,
} from "../../ui/Icons";
import TomatoImage from "../../assets/Tomato.jpg";
import ZucchiniImage from "../../assets/Zucchini.jpg";

const AiInsights = () => {
  return (
    <>
      {/* AI Care Insights & Crop Health Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 ">
        {/* Box 1: AI Care Insights */}
        <div className="xl:col-span-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#111827] flex items-center space-x-1.5">
            <AI_CareIcon />
            <span>AI Care Insights</span>
          </h3>

          <div className="space-y-3 ">
            <div
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pt-3.5 pb-3.5 text-xs 
                flex flex-row items-center"
            >
              <div className="bg-slate-500 p-1 m-3 rounded-lg h-10 text flex flex-row items-center">
                <MoistureOptimalIcon />
              </div>

              <div>
                <h4 className="font-bold text-[#374151] flex items-center justify-between">
                  <span>Tomato Maintenance</span>
                </h4>

                <p className="text-[#6B7280] leading-relaxed">
                  Tomatoes are in flowering stage. Keep moisture levels
                  consistent to ensure fruit set.
                </p>
              </div>
            </div>

            <div
              className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pt-3.5 pb-3.5 text-xs 
                flex flex-row items-center"
            >
              <div className="bg-slate-500 p-1 m-3 rounded-lg h-10 text flex flex-row items-center">
                <SettingsIcon className="text-white" />
              </div>

              <div>
                <h4 className="font-bold text-[#374151] flex items-center justify-between">
                  <span>Zucchini Sunlight</span>
                </h4>

                <p className="text-[#6B7280] mt-1 leading-relaxed">
                  Zucchini seedlings in Sector B prefer early morning sun.
                  Retract nets before 10:00 AM.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Live Crops Cards */}
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tomato Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl shadow-inner">
                    <img className="rounded-md" src={TomatoImage} alt="" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#111827]">Tomato</h4>
                    <p className="text-[10px] text-[#6B7280] tracking-wider uppercase font-semibold">
                      GROWTH STAGE
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#0A3D24]">33</span>
                  <p className="text-[9px] text-[#6B7280] font-medium uppercase">
                    Days Left
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full mt-4">
                <div className="bg-[#10B981] h-1.5 rounded-full w-[65%]"></div>
              </div>
            </div>

            {/* Sub Conditions Indicators */}
            <div className="grid grid-cols-2 gap-2 mb-6   ">
              <div
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] h-16
                    flex flex-row items-center justify-center "
              >
                <div className="pr-2 ">
                  <svg
                    width="10"
                    height="12"
                    viewBox="0 0 10 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.82708 9.91667C4.94375 9.90695 5.0434 9.86076 5.12604 9.77812C5.20868 9.69549 5.25 9.59583 5.25 9.47917C5.25 9.34306 5.20625 9.23368 5.11875 9.15104C5.03125 9.0684 4.91944 9.03195 4.78333 9.04167C4.38472 9.07083 3.96181 8.96146 3.51458 8.71354C3.06736 8.46563 2.78542 8.01597 2.66875 7.36458C2.64931 7.25764 2.59826 7.17014 2.51562 7.10208C2.43299 7.03403 2.33819 7 2.23125 7C2.09514 7 1.98333 7.05104 1.89583 7.15312C1.80833 7.25521 1.77917 7.37431 1.80833 7.51042C1.97361 8.39514 2.3625 9.02708 2.975 9.40625C3.5875 9.78542 4.20486 9.95556 4.82708 9.91667ZM4.66667 11.6667C3.33472 11.6667 2.22396 11.2097 1.33438 10.2958C0.444792 9.38194 0 8.24444 0 6.88333C0 5.91111 0.386458 4.85382 1.15937 3.71146C1.93229 2.5691 3.10139 1.33194 4.66667 0C6.23194 1.33194 7.40104 2.5691 8.17396 3.71146C8.94688 4.85382 9.33333 5.91111 9.33333 6.88333C9.33333 8.24444 8.88854 9.38194 7.99896 10.2958C7.10938 11.2097 5.99861 11.6667 4.66667 11.6667ZM4.66667 10.5C5.67778 10.5 6.51389 10.1573 7.175 9.47188C7.83611 8.78646 8.16667 7.92361 8.16667 6.88333C8.16667 6.17361 7.87257 5.37153 7.28438 4.47708C6.69618 3.58264 5.82361 2.60556 4.66667 1.54583C3.50972 2.60556 2.63715 3.58264 2.04896 4.47708C1.46076 5.37153 1.16667 6.17361 1.16667 6.88333C1.16667 7.92361 1.49722 8.78646 2.15833 9.47188C2.81944 10.1573 3.65556 10.5 4.66667 10.5Z"
                      fill="#116C4A"
                    />
                  </svg>
                </div>
                <div className=" ">
                  <span className="text-[#6B7280] block text-[9px] uppercase font-semibold">
                    WATER
                  </span>
                  <strong className="text-[#0A3D24] font-bold">
                    Satisfied
                  </strong>
                </div>
              </div>

              <div
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] h-16
                    flex flex-row items-center justify-center "
              >
                <div className="pr-2 ">
                  <NeedsFeed />
                </div>
                <div className=" ">
                  <span className="text-[#6B7280] block text-[9px] uppercase font-semibold">
                    NUTRIENTS
                  </span>
                  <strong className="text-[#0A3D24] font-bold">
                    Needs Feed
                  </strong>
                </div>
              </div>

              <div
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] h-16
                    flex flex-row items-center justify-center "
              >
                <div className="pr-2 ">
                  <HealthyIcon />
                </div>
                <div className=" ">
                  <span className="text-[#6B7280] block text-[9px] uppercase font-semibold">
                    HEALTH
                  </span>
                  <strong className="text-[#0A3D24] font-bold">Healthy</strong>
                </div>
              </div>

              <div
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] h-16
                    flex flex-row items-center justify-center "
              >
                <div className="pr-2 ">
                  <LightOptimalIcon />
                </div>
                <div className=" ">
                  <span className="text-[#6B7280] block text-[9px] uppercase font-semibold">
                    LIGHT
                  </span>
                  <strong className="text-[#0A3D24] font-bold">Optimal</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Zucchini Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl shadow-inner">
                    <img className="rounded-md" src={ZucchiniImage} alt="" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#111827]">
                      Zucchini
                    </h4>
                    <p className="text-[10px] text-[#6B7280] tracking-wider uppercase font-semibold">
                      Growth stage
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#0A3D24]">39</span>
                  <p className="text-[9px] text-[#6B7280] font-medium uppercase">
                    Days Left
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full mt-4">
                <div className="bg-[#10B981] h-1.5 rounded-full w-[15%]"></div>
              </div>
            </div>

            {/* Sub Conditions Indicators */}
            <div className="grid grid-cols-2 gap-2 mb-6  ">
              <div
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] h-16
                    flex flex-row items-center justify-center "
              >
                <div className="pr-2 ">
                  <svg
                    width="10"
                    height="12"
                    viewBox="0 0 10 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.82708 9.91667C4.94375 9.90695 5.0434 9.86076 5.12604 9.77812C5.20868 9.69549 5.25 9.59583 5.25 9.47917C5.25 9.34306 5.20625 9.23368 5.11875 9.15104C5.03125 9.0684 4.91944 9.03195 4.78333 9.04167C4.38472 9.07083 3.96181 8.96146 3.51458 8.71354C3.06736 8.46563 2.78542 8.01597 2.66875 7.36458C2.64931 7.25764 2.59826 7.17014 2.51562 7.10208C2.43299 7.03403 2.33819 7 2.23125 7C2.09514 7 1.98333 7.05104 1.89583 7.15312C1.80833 7.25521 1.77917 7.37431 1.80833 7.51042C1.97361 8.39514 2.3625 9.02708 2.975 9.40625C3.5875 9.78542 4.20486 9.95556 4.82708 9.91667ZM4.66667 11.6667C3.33472 11.6667 2.22396 11.2097 1.33438 10.2958C0.444792 9.38194 0 8.24444 0 6.88333C0 5.91111 0.386458 4.85382 1.15937 3.71146C1.93229 2.5691 3.10139 1.33194 4.66667 0C6.23194 1.33194 7.40104 2.5691 8.17396 3.71146C8.94688 4.85382 9.33333 5.91111 9.33333 6.88333C9.33333 8.24444 8.88854 9.38194 7.99896 10.2958C7.10938 11.2097 5.99861 11.6667 4.66667 11.6667ZM4.66667 10.5C5.67778 10.5 6.51389 10.1573 7.175 9.47188C7.83611 8.78646 8.16667 7.92361 8.16667 6.88333C8.16667 6.17361 7.87257 5.37153 7.28438 4.47708C6.69618 3.58264 5.82361 2.60556 4.66667 1.54583C3.50972 2.60556 2.63715 3.58264 2.04896 4.47708C1.46076 5.37153 1.16667 6.17361 1.16667 6.88333C1.16667 7.92361 1.49722 8.78646 2.15833 9.47188C2.81944 10.1573 3.65556 10.5 4.66667 10.5Z"
                      fill="#116C4A"
                    />
                  </svg>
                </div>
                <div className=" ">
                  <span className="text-[#6B7280] block text-[9px] uppercase font-semibold">
                    WATER
                  </span>
                  <strong className="text-[#0A3D24] font-bold">Thirsty</strong>
                </div>
              </div>

              <div
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] h-16
                    flex flex-row items-center justify-center "
              >
                <div className="pr-2 ">
                  <NeedsFeed />
                </div>
                <div className=" ">
                  <span className="text-[#6B7280] block text-[9px] uppercase font-semibold">
                    NUTRIENTS
                  </span>
                  <strong className="text-[#0A3D24] font-bold">Optimal</strong>
                </div>
              </div>

              <div
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] h-16
                    flex flex-row items-center justify-center "
              >
                <div className="pr-2 ">
                  <HealthyIcon />
                </div>
                <div className=" ">
                  <span className="text-[#6B7280] block text-[9px] uppercase font-semibold">
                    HEALTH
                  </span>
                  <strong className="text-[#0A3D24] font-bold">Healthy</strong>
                </div>
              </div>

              <div
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[11px] h-16
                    flex flex-row items-center justify-center "
              >
                <div className="pr-2 ">
                  <LightOptimalIcon />
                </div>
                <div className=" ">
                  <span className="text-[#6B7280] block text-[9px] uppercase font-semibold">
                    LIGHT
                  </span>
                  <strong className="text-[#0A3D24] font-bold">Optimal</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AiInsights;
