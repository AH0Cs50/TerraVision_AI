import Sidebar from "../../../components/layout/Sidebar";
import DashboardHeader from "../../../components/layout/DashboardHeader";
import PlantHero from "../../../components/plant_detail/PlantHero";
import GrowthStage from "../../../components/plant_detail/GrowthStage";
import DiseaseAnalysis from "../../../components/plant_detail/DiseaseAnalysis";
import EnvironmentCard from "../../../components/plant_detail/EnvironmentCard";
import AITipsGrid from "../../../components/plant_detail/AITipsGrid";
import ActiveTasks from "../../../components/plant_detail/ActiveTasks";

import RoutineHealthScan from "../../../components/plant_detail/RoutineHealthScan";

import Plant_healthy_img from "../../../assets/plant/plant_healthy.jpg"; // assets/plant/plant_healthy.jpg

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPlantById } from "../../../api/plantsApi";
import { useAuthStore } from "../../../store/authStore";

import {
  Bug,
  Droplet,
  FlaskConical,
  Scale,
  Sun,
  Scissors,
  SquarePlus,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import { Balanced, RoutineMonitoring } from "../../../icons/CustomIcons";

const healthyTips = [
  {
    icon: <ShieldCheck className="text-[#2D6A4F]" />,
    title: "Routine Monitoring",
    description:
      "No pathogens detected. Continue daily visual inspections and automated spectral analysis.",
  },
  {
    icon: <Leaf className="text-[#2D6A4F]" />,
    title: "Nutrient Balance",
    description:
      "Nutrient levels are balanced across all tiers. Proceed with standard organic calcium.",
  },
  {
    icon: <Droplet className="text-[#2D6A4F]" />,
    title: "Hydration Maintenance",
    description:
      "Soil moisture is at target 72%. Automated drip irrigation will maintain this level.",
  },
  {
    icon: <Sun className="text-[#2D6A4F]" />,
    title: "Light Exposure",
    description:
      "Current light levels are optimal for the vegetative phase. No shading required.",
  },
];
const healthyTasks = [
  {
    icon: <ShieldCheck className="text-[#1d4332]" />,
    title: "Watering",
    description: "Apply 500ml of water to maintain optimal soil moisture.",
  },
  {
    icon: <FlaskConical className="text-[#1d4332]" />,
    title: "Fertilizing",
    description: "Add NPK nutrient solution to the root zone.",
  },
  {
    icon: <Scissors className="text-[#1d4332]" />,
    title: "Pruning",
    description: "Cut dried lower yellow leaves to enhance airflow.",
  },
  {
    icon: <SquarePlus className="text-[#1d4332]" />,
    title: "Disease Treatment",
    description: "Apply the recommended fungicide protocol.",
  },
  {
    icon: <Sun className="text-[#1d4332]" />,
    title: "Move Light",
    description: "Adjust shade covers to prevent afternoon leaf burn.",
  },
];
const PlantDetailHealthy = () => {
  // Image processing before display
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

  if (!plant) return <div>Loading...</div>;

  const imageUrl = plant.coverImageUrl || Plant_healthy_img;

  const recommendation = plant.hasDisease
    ? "Immediate treatment is recommended."
    : "Routine maintenance recommended.";

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden font-sans">
      د <Sidebar />د{" "}
      <div className="flex flex-col flex-1 overflow-hidden">
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
                />{" "}
              </div>
              <div className="flex-1">
                <DiseaseAnalysis
                  confidence={`${Math.round(plant.disease.confidence * 100)}%`}
                  isHealthy={!plant.hasDisease}
                  detectedIssue={plant.disease.name}
                  scientificName={null}
                  symptoms={["Lush Foliage", "Strong Stems", "Vibrant Color"]}
                  recommendation={recommendation}
                />
              </div>
            </div>
            {/* Surrounding Environment Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <EnvironmentCard
                icon={<Sun />}
                label="GROWTH STAGE"
                value={plant.growthStage}
                subLabel="STATUS"
                subValue=""
                statusText="ACTIVE"
                isWarning={false}
              />

              <EnvironmentCard
                icon={<Droplet />}
                label="SOIL MOISTURE"
                value={`${plant.soil?.moisture}%`}
                subLabel="SOIL"
                subValue={plant.soil?.type}
                statusText={plant.soil?.moisture > 50 ? "GOOD" : "LOW"}
                isWarning={plant.soil?.moisture < 50}
                isGreenValue={plant.soil?.moisture >= 50}
              />

              <EnvironmentCard
                icon={<Balanced />}
                label="PLANT TYPE"
                value={plant.category}
                subLabel="FAMILY"
                subValue={plant.family}
                statusText="NORMAL"
                isWarning={false}
              />

              <EnvironmentCard
                icon={<Bug />}
                label="HEALTH STATUS"
                value={plant.hasDisease ? "Infected" : "Healthy"}
                subLabel="AI"
                subValue=""
                statusText={plant.hasDisease ? "WARNING" : "SAFE"}
                isWarning={plant.hasDisease}
                isGreenValue={!plant.hasDisease}
              />
            </div>
            <AITipsGrid isHealthy={!plant.hasDisease} tips={healthyTips} />
            <ActiveTasks tasks={healthyTasks} />
            <RoutineHealthScan plant={plant} />{" "}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlantDetailHealthy;
