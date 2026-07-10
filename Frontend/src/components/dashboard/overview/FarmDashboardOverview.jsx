import { StatCard, EfficiencyCard } from "./OverviewStats";
import { DonutChart, GaugeChart, ResourceBar } from "./OverviewCharts";
import { Bug, ChartNoAxesCombined, Sprout } from "lucide-react";
import { PlantPotIcon } from "../../../icons/CustomIcons";

const FarmDashboardOverview = ({ dashboard }) => {
  // Dynamically extract incoming data from the backend
  const activePlants = dashboard?.totalPlants ?? 0;
  const healthyPlants = dashboard?.healthyPlants ?? 0;
  const diseasedPlants = dashboard?.diseasedPlants ?? 0;

  const healthyPercent =
    dashboard?.healthPercentages?.healthy ??
    (activePlants ? Math.round((healthyPlants / activePlants) * 100) : 0);

  const diseasePercent =
    dashboard?.healthPercentages?.diseased ??
    (activePlants ? Math.round((diseasedPlants / activePlants) * 100) : 0);

  // Calculate the percentage of resources needed to prevent design destruction at a value of 0
  const thirstyPlants = dashboard?.resourceDemand?.thirsty ?? 0;
  const feedPlants = dashboard?.resourceDemand?.needsFeed ?? 0;
  const lowLightPlants = dashboard?.resourceDemand?.lowLight ?? 0;

  const totalDemand = thirstyPlants + feedPlants + lowLightPlants || 1;

  return (
    <div className="w-full font-sans">
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Top row: Triple stat cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Sprout />}
            value={activePlants}
            label="Active Crops"
            accent="green"
          />
          <StatCard
            icon={<Bug />}
            value={diseasedPlants}
            label="Plants with Disease"
            accent="red"
          />
          <EfficiencyCard
            pct={(dashboard?.taskEfficiency?.efficiency ?? 0) / 100}
          />
        </div>

        {/* Bottom row: Strategic chart panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Farm Health Status Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                Farm Health Status
              </h2>
              <span className="text-gray-400 text-lg">
                <ChartNoAxesCombined className="text-gray-800" />{" "}
              </span>
            </div>
            <DonutChart
              healthyPercent={healthyPercent}
              diseasePercent={diseasePercent}
            />
          </div>

          {/* Current Pest Risk Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                Current Pest Risk
              </h2>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
                LOW RISK
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 flex-1 justify-center">
              <GaugeChart value={24} max={100} />
              <p className="text-center text-sm text-gray-500 leading-relaxed">
                Pest activity is 12% lower than last week. Ideal conditions for
                preventative spraying.
              </p>
            </div>
          </div>

          {/* Instant Resource Request Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 w-full">
            <h2 className="text-base font-semibold text-gray-800">
              Resource Demand
            </h2>
            <div className="flex flex-col gap-4 flex-1 justify-center">
              <ResourceBar
                label="Thirsty"
                plants={thirstyPlants}
                color="blue"
                pct={(thirstyPlants / totalDemand) * 100}
              />
              <ResourceBar
                label="Needs Feed"
                plants={feedPlants}
                color="green"
                pct={(feedPlants / totalDemand) * 100}
              />
              <ResourceBar
                label="Low Light"
                plants={lowLightPlants}
                color="yellow"
                pct={(lowLightPlants / totalDemand) * 100}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmDashboardOverview;
