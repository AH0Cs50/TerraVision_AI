import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { signupRequest } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";
import farmImg from "../../assets/farm.png";
import Navbar from "../../components/layout/Navbar";
import { validateSignup } from "../../validation/authValidator";

// Toast Notifications
import { toast, Toaster } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [location, setLocation] = useState({ lat: 31.5194, lng: 34.4584 });

  const loginToStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationFn: signupRequest,

    onSuccess: (data) => {
      loginToStore(data.user, data.token);

      toast.success("Account created successfully!");
      console.log(data);
    },

    onError: (error) => {
      console.log(error);

      if (error.response?.status === 409) {
        setFormErrors({
          email: error.response.data.message,
        });
        return;
      }

      setFormErrors({
        server:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormErrors({});

    const locationStringForValidation = location
      ? `${location.lat}, ${location.lng}`
      : "";

    const { isValid, errors } = validateSignup({
      name,
      email,
      password,
      agreed,
      location: locationStringForValidation,
    });

    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    // The actual, clean transmission in the specified backend format
    signupMutation.mutate({
      name,
      email,
      password,
      location: {
        coordinates: {
          lat: Number(location.lat),
          lon: Number(location.lng),
        },
      },
    });
  };
  return (
    <div className="bg-[#f9fafb] min-h-screen flex flex-col pt-16">
      <Navbar />
      <Toaster />

      <div className="flex-1 w-full flex items-center justify-center py-8 sm:py-2">
        <div className="w-full max-w-[1420px] mx-auto py-8">
          <div className="w-full bg-white rounded-md shadow-sm border border-gray-200 flex flex-col md:flex-row overflow-hidden items-stretch min-h-[620px]">
            {/* Left section: Image */}{" "}
            <div className="relative hidden md:flex md:w-1/2 bg-gray-900 p-10 lg:p-12 flex-col justify-center items-start">
              <img
                src={farmImg}
                alt="Farm Background"
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
            {/* Right section: The form */}{" "}
            <div className="flex md:w-1/2 justify-center px-8 sm:px-12 lg:px-16 py-12 items-center bg-white">
              <form onSubmit={handleSubmit} className="w-full">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
                  Create Your Account
                </h2>
                <p className="text-gray-400 text-sm mb-6 font-normal">
                  Join the future of intelligent agronomy today.
                </p>
                {/* The error message is displayed here in red */}{" "}
                {formErrors.server && (
                  <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md text-center font-semibold">
                    {formErrors.server}
                  </div>
                )}
                {/* 1. Full Name */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <div
                    className={`flex items-center bg-[#f8fafc] border border-gray-300 rounded-md px-3 py-2.5 focus-within:bg-white focus-within:border-[#2e9d4f] focus-within:ring-1 focus-within:ring-[#2e9d4f] transition-all ${formErrors.name ? "border-red-400 ring-1 ring-red-400" : ""}`}
                  >
                    <UserRound className="h-4 w-6 m-1 text-slate-500" />

                    <input
                      type="text"
                      placeholder="user name"
                      className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">
                      {formErrors.name}
                    </p>
                  )}
                </div>
                {/* Email Address */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div
                    className={`flex items-center bg-[#f8fafc] border border-gray-300 rounded-md px-3 py-2.5 focus-within:bg-white focus-within:border-[#2e9d4f] focus-within:ring-1 focus-within:ring-[#2e9d4f] transition-all ${formErrors.email ? "border-red-400 ring-1 ring-red-400" : ""}`}
                  >
                    <Mail className="h-4 w-6 m-1 text-slate-500" />

                    <input
                      type="email"
                      placeholder="example@email.com"
                      className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                {/* Farm / Garden Location */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      Farm / Garden Location
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setLocation({
                                lat: Number(
                                  position.coords.latitude.toFixed(4),
                                ),
                                lng: Number(
                                  position.coords.longitude.toFixed(4),
                                ),
                              });
                            },
                          );
                        }
                      }}
                      className="text-[11px] font-semibold text-[#2e9d4f] hover:text-[#143d22] flex items-center gap-1 transition-colors"
                    >
                      Locate My Position
                    </button>
                  </div>

                  <div className="relative w-full h-[120px] bg-[#f3f4f6] border border-gray-200 rounded-md overflow-hidden flex flex-col items-center justify-center p-2">
                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:14px_14px]"></div>
                    <div className="relative z-10 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] text-gray-500 font-medium tracking-tight text-center bg-white/80 px-2 py-0.5 rounded shadow-sm">
                        Selected Address:{" "}
                        {location
                          ? `${location.lat}° N, ${location.lng}° E`
                          : "No area specified yet."}
                      </span>
                    </div>
                  </div>
                  {formErrors.location && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">
                      {formErrors.location}
                    </p>
                  )}
                </div>
                {/* Password */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div
                    className={`flex items-center bg-[#f8fafc] border border-gray-300 rounded-md px-3 py-2.5 focus-within:bg-white focus-within:border-[#2e9d4f] focus-within:ring-1 focus-within:ring-[#2e9d4f] transition-all ${formErrors.password ? "border-red-400 ring-1 ring-red-400" : ""}`}
                  >
                    <Lock className="h-4 w-6 m-2 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters (Include A, a, 1)"
                      className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent  appearance-none "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">
                      {formErrors.password}
                    </p>
                  )}
                </div>
                {/* Terms & Conditions */}
                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreed}
                      onChange={() => setAgreed(!agreed)}
                      className="w-3.5 h-3.5 accent-[#2e9d4f] rounded cursor-pointer border-gray-300"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-gray-600 cursor-pointer select-none font-medium"
                    >
                      I agree to the{" "}
                      <span className="text-[#2e9d4f] hover:underline font-semibold">
                        Terms of Service
                      </span>{" "}
                      and{" "}
                      <span className="text-[#2e9d4f] hover:underline font-semibold">
                        Privacy Policy
                      </span>
                    </label>
                  </div>
                  {formErrors.agreed && (
                    <p className="text-red-500 text-[11px] mt-1 font-medium">
                      {formErrors.agreed}
                    </p>
                  )}
                </div>
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full bg-[#2e9d4f] hover:bg-[#206e37] text-white font-semibold px-8 py-2.5 rounded-md text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {signupMutation.isPending ? "Signing up..." : "Sign Up"}
                </button>
                <p className="text-center text-xs text-gray-500 mt-5 font-normal">
                  Already have an account?
                  <Link to="/login">
                    <span className="text-[#2e9d4f] font-semibold hover:underline cursor-pointer">
                      Log In
                    </span>
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
