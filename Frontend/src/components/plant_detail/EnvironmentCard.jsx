const EnvironmentCard = ({
  icon,
  label,
  value,
  subLabel,
  subValue,
  statusText,
  isWarning,
  isGreenValue,
}) => {
  // Icon color settings
  const iconBg = isWarning ? "bg-red-50" : "bg-[#EEF5F1]";
  const iconColor = isWarning ? "text-red-400" : "text-[#2D6A4F]";

  // Specify the text color for the main value (to prevent nested conditions below)
  const valueColor = isWarning
    ? "text-red-500"
    : isGreenValue
      ? "text-[#2D6A4F]"
      : "text-gray-800";

  // Set the color of the status badge in a neat and easily customizable way
  let statusBadgeColor = "bg-green-100 text-green-700"; // Default (ideal/active state)

  if (isWarning) {
    statusBadgeColor = "bg-red-100 text-red-600";
  } else if (statusText === "NONE" || statusText === "SAFE") {
    statusBadgeColor = "bg-gray-100 text-gray-500";
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[180px]">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${iconBg}`}
      >
        <span className={`text-xl leading-none ${iconColor}`}>{icon}</span>
      </div>

      {/* Naming */}
      <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">
        {label}
      </p>

      {/* Key Value */}
      <p className={`font-black text-lg leading-tight mb-4 ${valueColor}`}>
        {value}
      </p>

      {/* Separator */}
      <hr className="border-gray-100 mb-3" />

      {/* Secondary information and status */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">
            {subLabel}
          </p>
          {subValue && (
            <p className="text-gray-600 text-sm font-semibold mt-0.5">
              {subValue}
            </p>
          )}
        </div>

        {statusText && (
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider ${statusBadgeColor}`}
          >
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
};

export default EnvironmentCard;
