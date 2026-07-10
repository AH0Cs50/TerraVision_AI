import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Login_img from "../../assets/login_img.jpg";
import Navbar from "../../components/layout/Navbar";
import { loginRequest } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

import { GoogleIcon, FacebookIcon, AppleIcon } from "../../icons/CustomIcons";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuthStore((state) => state.login);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await loginRequest({
        email,
        password,
      });

      login(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      navigate("/dashboard/empty_dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f9fafb] min-h-screen flex flex-col pt-16">
      <Navbar />

      <div className="flex-1 w-full flex items-center justify-center py-8 sm:py-2">
        <div className="w-full max-w-[1420px] mx-auto py-8">
          <div className="w-full bg-white rounded-md shadow-sm border border-gray-200 flex flex-col md:flex-row overflow-hidden items-stretch min-h-[620px]">
            {/* Left section: Image */}
            <div className="relative hidden md:flex md:w-1/2 bg-gray-900 p-10 lg:p-12 flex-col justify-center items-start">
              <img
                src={Login_img}
                alt="Plants Background"
                className="absolute inset-0 w-full h-full object-cover object-center select-none"
              />
              <div className="absolute inset-0 bg-black/25 z-0" />

              <div className="relative flex flex-col items-start z-10 w-full text-left mt-auto mb-auto pl-4">
                <h2 className="text-2xl lg:text-[32px] font-semibold tracking-tight text-white max-w-md leading-snug mb-5 select-none">
                  TerraVision AI - Advanced Plant Management &amp; Health
                  Monitoring
                </h2>
                <div className="w-12 h-[3.5px] bg-[#2e9d4f] rounded-full" />
              </div>
            </div>
            {/* Right side: Login form */}
            <div className="flex md:w-1/2 justify-center px-8 sm:px-12 lg:px-16 py-12 items-center bg-white">
              <div className="w-full">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
                  Sign In
                </h2>
                <p className="text-gray-400 text-sm mb-6 font-normal">
                  Join the future of intelligent agronomy today.
                </p>
                {error && (
                  <div className="mb-4 p-3 rounded-md bg-red-100 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  {/* Email Address Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="flex items-center bg-[#f8fafc] border border-gray-300 rounded-md px-3 py-2.5 focus-within:bg-white focus-within:border-[#2e9d4f] focus-within:ring-1 focus-within:ring-[#2e9d4f] transition-all">
                      <input
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                      />
                    </div>
                  </div>

                  {/* 2. Password Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="flex items-center bg-[#f8fafc] border border-gray-300 rounded-md px-3 py-2.5 focus-within:bg-white focus-within:border-[#2e9d4f] focus-within:ring-1 focus-within:ring-[#2e9d4f] transition-all">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-gray-400 hover:text-gray-600 ml-2 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="size-5" />
                        ) : (
                          <Eye className="size-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe((v) => !v)}
                        className="w-3.5 h-3.5 rounded accent-[#2e9d4f] cursor-pointer border-gray-300"
                      />
                      Remember me
                    </label>
                    <a
                      href="#"
                      className="text-xs font-medium text-gray-500 hover:text-[#2e9d4f] transition-colors"
                    >
                      Forgot your password?
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-[#2e9d4f] hover:bg-[#206e37] text-white font-semibold px-8 py-2.5 rounded-md text-sm transition-all duration-300 shadow-sm flex items-center justify-center"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>
                </div>

                {/* Dividing Line */}
                {/* Dividing Line */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-500" />
                </div>

                {/* Social Media Buttons */}
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
                      className="flex-1 flex items-center justify-center py-2 border border-gray-500 rounded-md bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all duration-200"
                    >
                      {icon}
                    </button>
                  ))}
                </div>

                {/* Switch to SignUp Link */}
                <p className="text-center text-xs text-gray-500 mt-5 font-normal">
                  Don&apos;t have an account?{" "}
                  <Link to="/signup">
                    <snap className="font-semibold text-[#2e9d4f] hover:underline cursor-pointer">
                      Sign Up
                    </snap>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
