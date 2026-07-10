import { useState } from "react";
import { Leaf } from "lucide-react";

const PLATFORM_LINKS = [
  "Dashboard",
  "My Plants",
  "AI Diagnostics",
  "AI Advisor",
  "Resources",
  "Field Maps",
];
const COMPANY_LINKS = [
  "About Us",
  "Sustainability",
  "Careers",
  "Press Kit",
  "Contact",
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !message) return;
    setSent(true);
    setEmail("");
    setMessage("");
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <footer id="platform" className="bg-green-900 text-white pt-16 pb-8">
      <div className="w-full max-w-[1420px] mx-auto min-[1421px]:px-0 px-10">
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <Leaf className="size-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                TerraVision AI
              </span>
            </div>
            <p className="text-green-200/60 text-sm leading-relaxed mb-6">
              Empowering growers with medical-grade plant diagnostics and
              automated intelligence.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-green-200/60 hover:text-white text-sm transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-green-200/60 hover:text-white text-sm transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Form */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">
              Get in Touch
            </h4>
            {sent ? (
              <div className="bg-white/10 border border-green-400/30 text-green-300 px-4 py-3 rounded-xl text-sm">
                Message sent successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border border-white/10 focus:border-green-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-green-300/40 outline-none transition-colors"
                />
                <textarea
                  placeholder="Suggestions or complaints..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  required
                  className="bg-white/10 border border-white/10 focus:border-green-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-green-300/40 outline-none transition-colors resize-none"
                />
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Submit Message
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-green-300/40 text-xs">
            © 2026 TerraVision AI. Handcrafted for a greener future.
          </p>
          <div className="flex gap-5">
            <a
              href="#"
              className="text-green-300/40 hover:text-white text-xs transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-green-300/40 hover:text-white text-xs transition-colors"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
