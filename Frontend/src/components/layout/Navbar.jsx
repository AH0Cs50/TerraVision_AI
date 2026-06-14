import { useState, useEffect } from "react";
import { LeafIcon, MenuIcon, CloseIcon } from "../../ui/Icons";
import { Link } from "react-router-dom";

const nav_link = [
  { label: "Services", href: "#services" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Platform", href: "#platform" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-md"
      } border-b border-gray-100`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 ">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-105">
              <LeafIcon size={16} />
            </div>
            <span className="font-bold text-green-900 lg:text-lg text-md tracking-tight">
              TerraVision AI
            </span>
          </a>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-2 lg:gap-8">
            {nav_link.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm text-gray-600 hover:text-green-700 transition-colors font-medium"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Get Started */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <button className="text-sm text-gray-600 hover:text-green-700 font-medium transition-colors px-3 py-2">
                Login
              </button>
            </Link>

            <Link to="/signup">
              <button className="bg-gradient-to-r from-[#2e9d4f] to-[#143d22] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200 hover:shadow-md">
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        } bg-white border-t border-gray-100`}
      >
        <div className="px-4 py-4 flex flex-col gap-1">
          {nav_link.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-700 font-medium px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {label}
            </a>
          ))}
          <hr className="border-gray-100 my-2" />

          <Link to="/login">
            <button className="text-sm text-gray-600 font-medium px-3 py-2.5 text-left rounded-lg hover:bg-gray-50 transition-colors">
              Login
            </button>
          </Link>

          <button className="bg-gradient-to-r from-[#2e9d4f] to-[#143d22] text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition-all duration-300 hover:opacity-90 shadow-[0_15px_30px_-10px_rgba(20,61,34,0.4)] flex items-center gap-2">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
