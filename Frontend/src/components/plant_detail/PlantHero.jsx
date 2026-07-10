import Plant_healthy_img from "../../assets/plant/plant_healthy.jpg";

const PlantHero = ({ image, name, tags }) => {
  return (
    <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden">
      {/* Image of the plant as background */}
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.onerror = null; // Entering an infinite loop is prohibited
          e.currentTarget.src = Plant_healthy_img;
        }}
      />
      {/* A dark, transparent layer over the image to improve text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Text below above the image */}
      <div className="absolute bottom-4 left-4">
        {/* Plant name */}
        <h1 className="text-white text-3xl font-bold mb-2">{name}</h1>

        {/* Categories - such as: Crop, Nightshade Family, Loamy Soil */}
        <div className="flex flex-wrap gap-2">
          {tags.filter(Boolean).map((tag, index) => (
            <span
              key={index}
              className="bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlantHero;
