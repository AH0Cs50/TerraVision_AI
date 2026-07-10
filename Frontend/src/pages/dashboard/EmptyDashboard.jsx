import Plant from "../../assets/empty_dashboard_img.png";
import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";
import { Link } from "react-router-dom";

export default function EmptyDashboard() {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto pl-12 pr-6 py-8 w-full bg-[#F9FAFB]">
          <div className="w-full bg-white border border-[#E5E7EB] rounded-2xl shadow-sm px-8 py-16 lg:py-24 flex flex-col items-center text-center">
            {/* Welcoming Text */}
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0A3D24] tracking-tight">
              Good Morning, Hussam
            </h2>
            <p className="text-base sm:text-lg text-[#6B7280] mt-3 max-w-xl leading-relaxed">
              Your garden is waking up beautifully today. Here's your overview.
            </p>

            {/* Center Art/Image Container */}
            <div className="my-12 w-64 h-64 sm:w-72 sm:h-72 bg-gradient-to-b from-[#F3F4F6] to-[#E5E7EB] rounded-full flex items-center justify-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[#0A3D24]/5 opacity-30 blur-xl"></div>
              <img
                src={Plant}
                alt="Empty Garden Plant Illustration"
                className="w-full h-full object-cover rounded-full transition duration-300 transform hover:scale-105"
              />
            </div>

            {/* Bottom Call to Action Section */}
            <h3 className="text-2xl font-bold text-[#111827] tracking-tight">
              Your Garden is Ready to Grow
            </h3>
            <p className="text-sm sm:text-base text-[#6B7280] mt-3 max-w-2xl px-4 leading-relaxed">
              Start monitoring your plants with AI-powered insights. Add your
              first plant to begin tracking health, moisture, and disease scans.
            </p>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6">
              <Link to="/dashboard/add_plant">
                <button className="bg-[#0A3D24] hover:bg-[#124629] text-white text-base font-semibold px-8 py-4 rounded-xl shadow-md flex items-center justify-center space-x-2 transition transform active:scale-95">
                  <span className="text-xl font-bold">+</span>
                  <span>Add Your First Plant</span>
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
