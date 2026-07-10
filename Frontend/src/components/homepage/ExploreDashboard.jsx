import { useNavigate } from "react-router-dom";
import DashboardMockup from "./dashboard_mockup";
import { Radio, ChartNoAxesCombined, ArrowRight } from "lucide-react";

const ExploreDashboard = () => {
  const navigate = useNavigate();
  return (
    <section id="dashboard" className="py-16 lg:py-20 bg-[#f9fbf9]">
      <div className="w-full max-w-[1420px] mx-auto min-[1421px]:px-0 px-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          <div className="w-full lg:w-[52%] flex justify-start">
            <DashboardMockup />
          </div>

          <div className="w-full lg:w-[44%] text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Your Smart Garden
              <br />
              <span className="text-green-700">at a Glance</span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Experience a dashboard that feels as organic as your garden. Our
              modular widget workflow brings clinical metrics into a
              high-fidelity interface that rewards your curiosity.
            </p>

            {/* Key Features*/}
            <div className="space-y-6 mb-10">
              {[
                {
                  Icon: Radio,
                  title: "Real-time environmental telemetry",
                  desc: "Monitor soil microbiome, ambient humidity, and multi-spectrum light levels across micro-climates with sub-second latency.",
                },
                {
                  Icon: ChartNoAxesCombined,
                  title: "Predictive growth modeling",
                  desc: "AI forecasts leaf size and health trajectories based on historic care data and global botanical trends.",
                },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-200 border border-green-200 rounded-xl flex items-center justify-center text-green-700 flex-shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                      {title}
                    </h4>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-start w-full">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-gradient-to-r from-[#2e9d4f] to-[#143d22] text-white font-semibold px-6 py-3.5 rounded-lg text-sm transition-all duration-300 hover:opacity-90 shadow-[0_15px_30px_-10px_rgba(20,61,34,0.4)] flex items-center justify-start gap-2"
              >
                Explore the Dashboard
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExploreDashboard;
