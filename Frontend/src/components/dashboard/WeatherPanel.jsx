import React from "react";
import {
  WeatherIcon,
  UvIndexIcon,
  MoistureOptimalIcon,
  WindIcon,
  HumidityIcon,
  WarningIcon,
  LocationIcon,
} from "../../ui/Icons";

const WeatherPanel = () => {
  return (
    <div className="bg-gradient-to-r from-[hsl(137,36%,21%)] to-[#0f2918] text-white rounded-xl 
    p-6 shadow-sm font-sans select-none">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left side: Main temperature and location */}
        <div className="lg:col-span-4 space-y-4">
          {/* the site */}
          <div className="flex items-center space-x-2 text-[#A3BFB0] text-[11px] font-bold tracking-wider">
            <LocationIcon />{" "}
            <span className="uppercase">Deir Al-Balah, Gaza</span>
          </div>

          {/* High temperature*/}
          <div className="flex items-start">
            <span className="text-6xl font-black tracking-tighter leading-none">
              24
            </span>
            <span className="text-2xl font-light ml-0.5 mt-1">°C</span>
          </div>

          {/* ذ*/}
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <WeatherIcon />
              <span>Mostly Sunny</span>
            </div>
            <p className="text-[11px] text-[#A3BFB0] font-medium pl-7">
              Feels like 26°
            </p>
          </div>
        </div>












 {/* The complete right-hand section: Contains the four cards + the warning rectangle */}
         <div className="lg:col-span-8 flex flex-col space-y-4 w-full ">
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full h-40">
    
            {/* UV Index */}
            <div className="bg-[#194E32] rounded-xl p-4 flex flex-col justify-between min-h-[115px]">
              <div className="pt-2 flex justify-between items-center text-[10px] font-bold text-[#A3BFB0] tracking-wider uppercase">
                <span>UV Index</span>
                <UvIndexIcon />
              </div>
              <div className="text-2xl font-extrabold leading-none pt-4">
                4.2
              </div>
              <div className="pb-6">
                <div className="w-full bg-[#114529] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#A3BFB0] h-full rounded-full w-[45%]"></div>
                </div>
                <span className="text-[9px] text-[#A3BFB0] font-bold tracking-wide uppercase mt-1 pt-1 block">
                  Moderate
                </span>
              </div>
            </div>





            {/* Moisture */}
            <div className="bg-[#194E32] rounded-xl p-4 flex flex-col justify-between min-h-[115px]">
              <div className="pt-2 flex justify-between items-center text-[10px] font-bold text-[#A3BFB0] tracking-wider uppercase">
                <span>Moisture</span>
                <MoistureOptimalIcon />
              </div>
              <div className="text-2xl font-extrabold leading-none pt-4">
                58%
              </div>
              <div className="pb-6">
                <div className="w-full bg-[#114529] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#10B981] h-full rounded-full w-[58%]"></div>
                </div>
                <span className="text-[9px] text-[#A3BFB0] font-bold tracking-wide uppercase mt-1 pt-1 block">
                  Optimal
                </span>
              </div>
            </div>

            {/* Wind */}
            <div className="bg-[#194E32] rounded-xl p-4 flex flex-col justify-between min-h-[115px]">
              <div className="pt-2 flex justify-between items-center text-[10px] font-bold text-[#A3BFB0] tracking-wider uppercase">
                <span>Wind</span>
                <WindIcon />
              </div>
              <div className="text-2xl font-extrabold leading-none pt-6 pb-6">

                <span className="text-2xl font-extrabold leading-none mb-1">
                  14
                </span>
                <span className="text-[9px] text-[#A3BFB0] font-bold tracking-wide uppercase mt-1 pt-1 block">
                  km/h
                </span>
                <span className="text-[9px] text-[#A3BFB0] font-bold tracking-wide uppercase mt-1 pt-1 block">
                  NW <br /> Direction
                </span>

                
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-[#194E32] rounded-xl p-4 flex flex-col justify-between min-h-[115px]">
              <div className="pt-2 flex justify-between items-center text-[10px] font-bold text-[#A3BFB0] tracking-wider uppercase">
                <span>Humidity</span>
                <HumidityIcon />
              </div>
              <div className="text-2xl font-extrabold leading-none pt-4">
                42%
              </div>
              <div className="pb-5 text-[9px] text-[#A3BFB0] font-bold tracking-wide uppercase block">
                Dew Pt: 12°
              </div>
            </div>
          </div>

          {/*  AI Warning Box */}
          <div className="bg-[#194E32] rounded-xl p-3.5 flex items-center space-x-3 border border-[#1E5638]/50 w-full shadow-sm">
            <div className="w-7 h-7 bg-[#FDE8E8] rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-[#E11D48] text-xs font-bold">
                <WarningIcon />
              </span>
            </div>
            <p className="text-xs text-[#E7F0EC] leading-relaxed font-normal">
              AI Warning: Sector B wind gusting to 35km/h after 3 PM. Secure
              floating covers.
            </p>
          </div>
        </div>{" "}
      </div>
    </div>
  );
};

export default WeatherPanel;
