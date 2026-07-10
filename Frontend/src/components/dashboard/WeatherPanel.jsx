import React from "react";
import { Droplet, MapPin, Sun, TriangleAlert, Wind } from "lucide-react";
import { WeatherIcon, MoistureOptimalIcon } from "../../icons/CustomIcons";

// Convert wind direction (0-360) to text compass (N, NW, SW...)
const degToCompass = (deg) => {
  if (deg == null) return "N/A";
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return dirs[Math.round(deg / 22.5) % 16];
};

// UV indicator details: Text + Strip width + Color
const getUvDetails = (value) => {
  const v = Number(value) || 0;
  const text =
    v <= 2
      ? "Low"
      : v <= 5
        ? "Moderate"
        : v <= 7
          ? "High"
          : v <= 10
            ? "Very High"
            : "Extreme";
  const width = `${Math.min(Math.max((v / 11) * 100, 15), 100)}%`;
  const color = v <= 2 ? "bg-[#10B981]" : "bg-[#A3BFB0]";
  return { text, width, color };
};

// Details of the ground moisture index (moisture) - not always present in the API
const getMoistureDetails = (moisture) => {
  const value = moisture?.value;
  if (value == null) {
    return {
      display: "N/A",
      text: "No Data",
      color: "bg-white/20",
      width: "0%",
    };
  }
  const num = Math.min(Math.max(Number(value), 0), 100);
  const color =
    num < 40 ? "bg-amber-500" : num <= 75 ? "bg-[#10B981]" : "bg-blue-500";
  return {
    display: `${num}%`,
    text: moisture.category || "Optimal",
    color,
    width: `${num}%`,
  };
};

const StatCard = ({ label, icon, value, children }) => (
  <div className="bg-white/10 rounded-xl p-4 flex flex-col justify-between min-h-[115px]">
    <div className="flex justify-between items-center text-[10px] font-bold text-[#A3BFB0] tracking-wider uppercase">
      <span>{label}</span>
      {icon}
    </div>
    <div className="text-2xl font-extrabold leading-none pt-2">{value}</div>
    {children}
  </div>
);

const ProgressBar = ({ color, width, caption }) => (
  <div className="pt-2">
    <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width }}
      ></div>
    </div>
    <span className="text-[9px] text-[#A3BFB0] font-bold tracking-wide uppercase mt-1.5 block">
      {caption}
    </span>
  </div>
);

const WeatherPanel = ({ data }) => {
  const weather = data?.weather || data?.data?.weather || {};

  const location = weather.location || {};
  const temperature = weather.temperature || {};
  const humidity = weather.humidity || {};
  const wind = weather.wind || {};
  const condition = weather.weather || {};

  const cityName = location.name || location.city || "Local Area";
  const displayLocation = location.country
    ? `${cityName}, ${location.country}`
    : cityName;

  const tempCurrent =
    temperature.current != null ? Math.round(temperature.current) : "--";
  const feelsLike =
    temperature.feelsLike != null ? Math.round(temperature.feelsLike) : "--";
  const conditionText = condition.description || condition.main || "Clear";

  const uv = getUvDetails(weather.uvIndex);
  const moisture = getMoistureDetails(weather.moisture);

  const windSpeed = wind.speed != null ? Math.round(wind.speed) : "--";
  const windDirection = degToCompass(wind.deg);

  const humidityValue = humidity.value ?? "--";
  const dewPoint = humidity.dewPoint ?? "--";

  return (
    <div
      className="text-white rounded-xl p-6 shadow-sm font-sans select-none"
      style={{
        background: "linear-gradient(135deg, #2C684E 0%, #1D4735 100%)",
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left section: Location and temperature */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center space-x-2 text-[#A3BFB0] text-[11px] font-bold tracking-wider uppercase">
            <MapPin className="text-white" />
            <span>{displayLocation}</span>
          </div>

          <div className="flex items-start">
            <span className="text-6xl font-black tracking-tighter leading-none">
              {tempCurrent}
            </span>
            <span className="text-2xl font-light ml-0.5 mt-1">°C</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-sm font-bold">
              <WeatherIcon size="40" />
              <span className="capitalize">{conditionText}</span>
            </div>
            <p className="text-[11px] text-[#A3BFB0] font-medium pl-7">
              Feels like {feelsLike}°
            </p>
          </div>
        </div>

        {/* Right section: Indicator cards */}
        <div className="lg:col-span-8 flex flex-col space-y-4 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full min-h-[140px]">
            <StatCard
              label="UV Index"
              icon={<Sun className="text-white" size={16} />}
              value={weather.uvIndex ?? "--"}
            >
              <ProgressBar
                color={uv.color}
                width={uv.width}
                caption={uv.text}
              />
            </StatCard>

            <StatCard
              label="Moisture"
              icon={<MoistureOptimalIcon />}
              value={moisture.display}
            >
              <ProgressBar
                color={moisture.color}
                width={moisture.width}
                caption={moisture.text}
              />
            </StatCard>

            <StatCard
              label="Wind"
              icon={<Wind className="text-white w-5" />}
              value={windSpeed}
            >
              <span className="text-[9px] text-[#A3BFB0] font-bold tracking-wide uppercase block mt-0.5">
                km/h
              </span>
              <span className="text-[9px] text-white font-extrabold tracking-wide uppercase mt-1 block">
                {windDirection}
              </span>
            </StatCard>

            <StatCard
              label="Humidity"
              icon={<Droplet className="h-5 w-4 text-white" />}
              value={`${humidityValue}%`}
            >
              <span className="text-[9px] text-[#A3BFB0] font-bold tracking-wide uppercase block pt-2">
                Dew Pt: {dewPoint}°
              </span>
            </StatCard>
          </div>

          {/* Warning Box */}
          <div className="bg-white/10 rounded-xl p-3.5 flex items-center space-x-3 border border-white/10 w-full shadow-sm">
            <div className="w-7 h-7 bg-[#FDE8E8] rounded-lg flex items-center justify-center shrink-0">
              <TriangleAlert className="text-red-500 w-5" />
            </div>
            <p className="text-xs text-[#E7F0EC] leading-relaxed font-normal">
              {weather.warning ||
                "No critical weather warnings for your crops today. Ideal farming conditions."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;
