import React from "react";

// Donut Chart Component
export function DonutChart({ healthyPercent, diseasePercent }) {
  const segments = [
    {
      pct: healthyPercent,
      color: "#1a7a4a",
      label: `${healthyPercent}% Healthy`,
      dot: "bg-emerald-700",
    },
    {
      pct: diseasePercent,
      color: "#e53935",
      label: `${diseasePercent}% Diseased`,
      dot: "bg-red-600",
    },
  ];

  const r = 54,
    cx = 70,
    cy = 70,
    stroke = 16,
    circ = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-36 h-36">
        
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          {segments.map((seg, i) => {
            const da = (seg.pct / 100) * circ;
            const offset = circ - (cum / 100) * circ;
            cum += seg.pct;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${da} ${circ - da}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">
            {healthyPercent}%
          </span>
          <span className="text-xs text-gray-500 text-center leading-tight">
            HEALTHY
            <br />
            NOW
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${s.dot}`}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Gauge Chart Component
export function GaugeChart({ value = 24, max = 100 }) {
  const pct = value / max;
  const r = 60,
    cx = 80,
    cy = 80;
  const toXY = (deg, rad) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  };
  const start = toXY(-180, r);
  const end = toXY(0, r);
  const endPt = toXY(pct * 180 - 270, r);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-44 h-24 overflow-hidden">
        <svg viewBox="0 0 160 90" className="w-full">
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${endPt.x} ${endPt.y}`}
            fill="none"
            stroke="#1a7a4a"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <span className="text-3xl font-bold text-gray-900">
            {value}
            <span className="text-lg text-gray-400">/{max}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Resource Bar Component
export function ResourceBar({ label, plants, color = "green", pct = 0 }) {
  const BAR_COLOR = {
    blue: "bg-blue-500",
    green: "bg-emerald-600",
    yellow: "bg-yellow-400",
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide">
        <span>{label}</span>
        <span className="text-gray-700 font-semibold">{plants} Plants</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${BAR_COLOR[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
