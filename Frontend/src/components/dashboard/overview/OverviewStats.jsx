import React from "react";

const ACCENT = {
  green: {
    border: "#047857",
    icon: "bg-emerald-50 text-emerald-700",
    value: "text-gray-900",
  },
  red: {
    border: "#f87171",
    icon: "bg-red-50 text-red-500",
    value: "text-red-500",
  },
  dark: {
    border: "#1f2937",
    icon: "bg-gray-100 text-gray-800",
    value: "text-gray-900",
  },
};

const cardBorder = (color) => ({
  borderTop: `0.5px solid ${color}`,
  borderRight: `0.5px solid ${color}`,
  borderBottom: `0.5px solid ${color}`,
  borderLeft: `4px solid ${color}`,
});

export function StatCard({ icon, value, label, accent }) {
  const { border, icon: iconCls, value: valueCls } = ACCENT[accent];
  return (
    <div
      className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm w-full"
      style={cardBorder(border)}
    >
      <div className={`rounded-xl p-3 text-2xl ${iconCls}`}>{icon}</div>
      <div>
        <p className={`text-3xl font-bold leading-none ${valueCls}`}>{value}</p>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export function EfficiencyCard({ pct = 0 }) {
  const r = 22,
    circ = 2 * Math.PI * r;
  return (
    <div
      className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm w-full"
      style={cardBorder("#1f2937")}
    >
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke="#1a7a4a"
            strokeWidth="6"
            strokeDasharray={`${pct * circ} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
          {Math.round(pct * 100)}%
        </span>
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900 leading-none">Efficiency</p>
        <p className="mt-1 text-sm text-gray-500">Tasks Completed</p>
      </div>
    </div>
  );
}