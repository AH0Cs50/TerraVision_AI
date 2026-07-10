import FeatureCard from "./FeatureCard";

import { DiagIcon, WeatherIcon, BotanyIcon } from "../../icons/CustomIcons";
import { Lightbulb, ChartNoAxesCombined, NotepadText } from "lucide-react";

// BrainCircuit

const FEATURES = [
  {
    icon: DiagIcon,
    iconSize: 25,
    title: "AI Diagnostics",
    desc: "Platform-assisted assessments evaluate health trends based on visual analysis, environmental conditions, and cross-referenced growth data.",
  },
  {
    icon: WeatherIcon,
    iconSize: 25,
    title: "Live Weather Intelligence",
    desc: "Real-time updates with automated micro-climate forecasts to help you protect soil nutrients and optimize watering conditions.",
  },
  {
    icon: Lightbulb,
    iconSize: 25,
    title: "Proactive AI Guidance",
    desc: "Smart recommendations adapt to your plant's behavior, environmental conditions, nutrient needs and microbiome profile.",
  },
  {
    icon: ChartNoAxesCombined,
    iconSize: 25,
    title: "Growth Modeling",
    desc: "Mathematically validated growth curves and early forecasting data to give you precise and scientific clarity.",
  },
  {
    icon: BotanyIcon,
    iconSize: 25,
    title: "Botany Circles",
    desc: "An inspired community forum to share insights, high-quality care of seeds, and targeted growing success stories.",
  },
  {
    icon: NotepadText,
    iconSize: 25,
    title: "Daily Care Tasks",
    desc: "Personalized, gamified daily tasks that makes every point in your collection reach the perfect balance.",
  },
];

const Features = () => {
  return (
    <section
      id="services"
      className="bg-gradient-to-b from-[#163e29] to-[#0b1f14] py-20 lg:py-28"
    >
      <div className="w-full max-w-[1420px] mx-auto min-[1421px]:px-0 px-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            Comprehensive Smart Farming Suite
          </h2>
          <p className="text-white opacity-40 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Advanced tools designed to empower every grower with data-driven
            precision and AI-powered insights.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 bf">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
