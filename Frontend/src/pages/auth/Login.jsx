import { useState } from "react";
import Login_img from "../../assets/login_img.jpg";
import Navbar from "../../components/layout/Navbar";

import {
  ShowPasswordIcon,
  HidePasswordIcon,
  GoogleIcon,
  FacebookIcon,
  AppleIcon,
} from "../../ui/Icons";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden mt-14 ">
          {/* Section Left - Image */}
          <div className="hidden md:flex w-1/2 relative bg-gray-900">
            <img
              className="absolute inset-0 w-full h-full object-cover"
              src={Login_img}
              alt="Plants Background"
            />
            <div className="absolute inset-0 bg-black/40"></div>

            <div className="absolute inset-0 flex flex-col justify-center items-start text-left p-10 lg:p-20 z-10">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-medium tracking-tight text-white max-w-sm leading-snug mb-5 select-none">
                TerraVision AI - Advanced Plant Management & Health Monitoring
              </h2>
              <div className="w-14 h-[3px] bg-[#43a047] rounded-full"></div>
            </div>
          </div>

          {/*  Section Right - Login Form */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-white overflow-y-auto">
            <div className="w-full max-w-md space-y-5 lg:space-y-6">
              <h1 className="text-center text-2xl lg:text-3xl font-extrabold tracking-tight">
                <span className="text-[#43a047]">Terra</span>
                <span className="text-[#2e7d32]">Vision</span>
                <span className="text-gray-900"> AI</span>
              </h1>

              <h2 className="text-lg lg:text-xl font-semibold text-gray-800">
                Sign In
              </h2>

              <div className="space-y-3 lg:space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 lg:py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2.5 lg:py-3 pr-10 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <HidePasswordIcon /> : <ShowPasswordIcon />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe((v) => !v)}
                      className="w-4 h-4 rounded accent-green-700 cursor-pointer"
                    />
                    Remember me
                  </label>
                  <a
                    href="#"
                    className="text-xs text-gray-500 hover:text-green-700 transition-colors"
                  >
                    Forgot your password?
                  </a>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 lg:py-3 rounded-md bg-[#2e7d32] text-white text-sm font-semibold tracking-wide hover:bg-[#256427] active:scale-[.99] transition"
                >
                  Sign In
                </button>
              </div>

              {/* dividing line or straight line*/}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-xs text-gray-500 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Social media buttons*/}
              <div className="flex gap-3">
                {[
                  { icon: <GoogleIcon />, label: "Google" },
                  { icon: <FacebookIcon />, label: "Facebook" },
                  { icon: <AppleIcon />, label: "Apple" },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={`Sign in with ${label}`}
                    className="flex-1 flex items-center justify-center py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition"
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-gray-500 pt-1">
                Don&apos;t have an account?{" "}
                <a
                  href="#"
                  className="font-semibold text-[#2e7d32] hover:underline"
                >
                  Sign Up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
