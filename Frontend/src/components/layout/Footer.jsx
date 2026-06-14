import { useState } from "react";
import { LeafIcon } from "../../ui/Icons";

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12 ">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white">
                <LeafIcon size={16} />
              </div>
              <span className="font-bold text-white text-lg">
                TerraVision AI
              </span>
            </div>
            <p className="text-green-300/60 text-sm leading-relaxed max-w-xs">
              Cultivating environmental intelligence through world-class AI and
              botanical science. Your partner in sustainable growth.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-green-400 mb-4">
              Platform
            </h4>
            <ul className="flex flex-col gap-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-green-300/70 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-green-400 mb-4">
              Company
            </h4>
            <ul className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-green-300/70 hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Form */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-green-400 mb-4">
              Send Us a Message
            </h4>
            {sent ? (
              <div className="bg-green-700/40 border border-green-500/40 rounded-xl p-4 text-center">
                <span className="text-2xl mb-2 block">✅</span>
                <p className="text-sm text-green-300 font-medium">
                  Message sent!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Your email"
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
