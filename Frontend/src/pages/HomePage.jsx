import Navbar from "../components/layout/Navbar";
import Hero from "../components/homepage/Hero";
import Features from "../components/homepage/Features";
import ExploreDashboard from "../components/homepage/ExploreDashboard";
import Footer from "../components/layout/Footer";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <ExploreDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;