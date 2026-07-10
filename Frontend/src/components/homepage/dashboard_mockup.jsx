import dashboard_mockup from "../../assets/dashboard_mockup.png";

const DashboardMockup = () => {
  return (
    <div className="relative w-full max-w-2xl">
      <div className="bg-white p-3 rounded-[1.5rem] overflow-hidden shadow-2xl">
        
        {/* تم تغيير النسبة إلى 4/3 لزيادة الارتفاع قليلاً ليتناسب مع النص وتتضح التفاصيل */}
        <div className="bg-[#1a1a1a] rounded-[1.5rem] overflow-hidden aspect-[4/3] flex items-center justify-center relative">
          <img
            src={dashboard_mockup}
            alt="Monstera plant"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.parentElement.querySelector(".fallback-plant")) {
                e.target.parentElement.querySelector(".fallback-plant").style.display = "flex";
              }
            }}
          />
        </div>

      </div>
    </div>
  );
};

export default DashboardMockup;