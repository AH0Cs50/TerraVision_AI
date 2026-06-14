import { TelemetryIcon, PredictIcon, ArrowRightIcon } from "../../ui/Icons";
import DashboardMockup from "./dashboard_mockup";

const ExploreDashboard = () => {
  return (
    <section id="dashboard" className="py-20 lg:py-28 bg-[#f9fbf9] max-w-6xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20 ">
          <div className="flex-1 w-full">
            {/* Import DashboardMockup image */}
            <DashboardMockup />
          </div>

          {/* Dashboard title Text */}
          <div className="flex-1 max-w-lg text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Your Smart
              <br />
              Garden
              <br />
              <span className="text-green-700">at a Glance</span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Experience a dashboard that feels as organic as your garden. Our
              modular widget workflow brings clinical metrics into a
              high-fidelity interface that rewards your curiosity.
            </p>

            {/* Text feature points  */}
            <div className="flex flex-col gap-5 mb-10 ">
              {[
                {
                  Icon: TelemetryIcon,
                  title: "Real-time health telemetry",
                  desc: "Instant monitoring across multiple rooms and micro-climates with sub-second latency.",
                },
                {
                  Icon: PredictIcon,
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

            <button className="bg-gradient-to-r from-[#2e9d4f] to-[#143d22] text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition-all duration-300 hover:opacity-90 shadow-[0_15px_30px_-10px_rgba(20,61,34,0.4)] flex items-center gap-2">
              Explore the Dashboard
              <ArrowRightIcon size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExploreDashboard;
