import { ArrowUpRight } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, desc, iconSize }) => {
  return (
    <div className="bg-[#152926] hover:bg-green-900/80 border border-green-800/40 hover:border-green-600/50 rounded-2xl p-6 transition-all duration-300 group cursor-pointer">
      <div className="flex items-start justify-between mb-5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-green-400 transition-colors  bg-black">
          <Icon size={iconSize} className="text-white" />
        </div>

        <div className="text-white group-hover:text-green-400 transition-colors ">
          <ArrowUpRight className="w-5"/>
        </div>
      </div>
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <p className="text-green-300/60 text-sm leading-relaxed">{desc}</p>
    </div>
  );
};
export default FeatureCard;
