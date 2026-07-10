import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import plantImg from "../../assets/plant.png";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-16 min-h-screen flex items-center bg-[#f8f9fa]">
      <div className="w-full max-w-[1420px] mx-auto min-[1421px]:px-0 px-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-16 lg:py-24">
          {/* Hero Text */}
          <div className="flex-1 max-w-xl text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-gray-900 mb-6">
              Cultivate
              <br />
              Clarity
              <br />
              <span className="text-green-700">in Every Leaf.</span>
            </h1>

            <p className="text-gray-500 text-base sm:text-lg mb-8 leading-relaxed">
              Precision medical-grade diagnostics and real-time environmental
              monitoring transformed into a beautiful, gamified experience for
              your botanica collection.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link to="/dashboard/my_garden">
                <button className="bg-gradient-to-r from-[#2e9d4f] to-[#143d22] text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition-all duration-300 hover:opacity-90 shadow-[0_15px_30px_-10px_rgba(20,61,34,0.4)] flex items-center gap-2">
                  Start Your Smart Garden
                </button>
              </Link>
              <Link to="/login">
                <button className="border border-gray-300 hover:border-green-600 text-gray-700 hover:text-green-700 font-semibold px-6 py-3.5 rounded-lg text-sm transition-all duration-200">
                  Login
                </button>
              </Link>
            </div>
          </div>

          {/* Hero - Plant Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative bg-white p-4 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
              <img
                className="rounded-[1.5rem]"
                src={plantImg}
                alt="Monstera plant"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.querySelector(
                    ".fallback-plant",
                  ).style.display = "flex";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
