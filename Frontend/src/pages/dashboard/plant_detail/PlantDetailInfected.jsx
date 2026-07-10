import React from "react";
import Sidebar from "../../../components/layout/Sidebar";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import PlantHero from "../../../components/plant_detail/PlantHero";
import GrowthStage from "../../../components/plant_detail/GrowthStage";
import DiseaseAnalysis from "../../../components/plant_detail/DiseaseAnalysis";
import EnvironmentCard from "../../../components/plant_detail/EnvironmentCard";
import AITipsGrid from "../../../components/plant_detail/AITipsGrid";
import ActiveTasks from "../../../components/plant_detail/ActiveTasks";
import RoutineHealthScan from "../../../components/plant_detail/RoutineHealthScan";
import Plant_infected_img from "../../../assets/plant/plant_infected.jpg";

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPlantById } from "../../../api/plantsApi";
import { useAuthStore } from "../../../store/authStore";
import {
  Bug,
  Droplet,
  FlaskConical,
  Scissors,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { RoutineMonitoring } from "../../../icons/CustomIcons";

const infectedTips = [
  {
    icon: <RoutineMonitoring />,
    title: "Disease Management",
    description:
      "Apply a standard fungicide and remove any infected leaves immediately.",
  },
  {
    icon: <FlaskConical />,
    title: "Nutrient Protocol",
    description:
      "Add a potassium-rich nutrient supplement to your next watering.",
  },
  {
    icon: <Droplet />,
    title: "Irrigation & Hydration",
    description:
      "Increase watering frequency to keep the soil consistently moist.",
  },
  {
    icon: <Sun />,
    title: "Light Optimization",
    description: "Use light shade covers during the hottest afternoon hours.",
  },
];

const infectedTasks = [
  {
    icon: <ShieldCheck className="text-[#1d4332]" />,
    title: "Watering",
    description: "Apply 500ml of water to maintain optimal soil moisture.",
  },
  {
    icon: <FlaskConical />,
    title: "Fertilizing",
    description: "Add NPK nutrient solution to the root zone.",
  },
  {
    icon: <Scissors />,
    title: "Pruning",
    description: "Cut dried lower yellow leaves to enhance airflow.",
  },
  {
    icon: <RoutineMonitoring />,
    title: "Disease Treatment",
    description: "Apply the recommended fungicide protocol.",
  },
  {
    icon: <Sun />,
    title: "Move Light",
    description: "Adjust shade covers to prevent afternoon leaf burn.",
  },
];

export default function PlantDetailInfected() {
  const S3_BASE = "https://gateway.storjshare.io/plant/";
  const { uuid } = useParams();
  const token = useAuthStore((state) => state.token);

  const [plant, setPlant] = useState(null);

  useEffect(() => {
    const fetchPlant = async () => {
      try {
        const res = await getPlantById(uuid, token);
        setPlant(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlant();
  }, [uuid, token]);

  if (!plant) return <>Loading...</>;
  const imageUrl = plant.coverImageUrl || Plant_infected_img;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Top Header */}
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto pl-12 pr-6 py-8 w-full bg-[#F9FAFB]">
          <div className="w-full flex flex-col gap-6">
            <PlantHero
              image={imageUrl}
              name={plant.name}
              tags={[plant.category, plant.family, plant.soil?.type]}
            />
            {/* Growth stage and disease analysis */}
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              <div className="lg:w-1/3 shrink-0">
                <GrowthStage
                  plantAge={`${plant.ageDays} Days`}
                  harvestEst={
                    plant.expectedHarvestDate
                      ? new Date(plant.expectedHarvestDate).toLocaleDateString()
                      : "Unknown"
                  }
                  growthPercent={Math.min((plant.ageDays / 90) * 100, 100)}
                  description={plant.growthStage}
                />
              </div>
              <div className="flex-1">
                <DiseaseAnalysis
                  confidence={`${Math.round(plant.disease.confidence * 100)}%`}
                  isHealthy={!plant.hasDisease}
                  detectedIssue={plant.disease.name}
                  scientificName={plant.disease.scientificName || null}
                  symptoms={
                    plant.disease.symptoms || [
                      "Leaf spots",
                      "Stem lesions",
                      "Yellowing leaves",
                    ]
                  }
                  recommendation={
                    plant.hasDisease
                      ? "Immediate treatment is recommended."
                      : "Routine maintenance recommended."
                  }
                />{" "}
              </div>
            </div>
            {/* Surrounding Environment Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <EnvironmentCard
                icon={<Sun />}
                label="SUN EXPOSURE"
                value="8.2 hrs/day"
                subLabel="STATUS"
                subValue=""
                statusText="OPTIMAL"
                isWarning={false}
              />
              <EnvironmentCard
                icon={<Droplet />}
                label="MOISTURE LEVEL"
                value="Thirsty"
                subLabel="LAST WATERING"
                subValue="2 days ago"
                statusText={null}
                isWarning={true}
              />
              <EnvironmentCard
                icon={<FlaskConical />}
                label="FERTILIZATION"
                value="Needs Feed"
                subLabel="NUTRIENTS"
                subValue=""
                statusText="LOW"
                isWarning={true}
              />
              <EnvironmentCard
                icon={<Bug />}
                label="PESTICIDE NEED"
                value="Zero Detected"
                subLabel="BALANCE"
                subValue=""
                statusText="SAFE"
                isWarning={false}
              />
            </div>
            {/* The remaining components that support the page's functions */}
            <AITipsGrid isHealthy={false} tips={infectedTips} />
            <ActiveTasks tasks={infectedTasks} />
            <RoutineHealthScan plant={plant} />{" "}
          </div>
        </main>
      </div>
    </div>
  );
}
