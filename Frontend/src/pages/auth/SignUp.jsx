import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { signupRequest } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import farmImg from "../../assets/farm.png";
import Navbar from "../../components/layout/Navbar";
import { validateSignup } from '../../validation/authValidator';

import {
  UserIcon,
  EmailIcon,
  PasswordIcon,
  ShowPasswordIcon,
  HidePasswordIcon,
} from "./../../ui/Icons";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // use "agreed" state to checkbox
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const loginToStore = useAuthStore((state) => state.login);

  // Caching in React Query
  const signupMutation = useMutation({
    mutationFn: signupRequest,
    onSuccess: (data) => {
      loginToStore(data.user, data.token);
      alert('The account has been successfully created!');
    },
    onError: (error) => {
      // save server erorr in formErrors by setFormErrors
      setFormErrors({ server: error.message });
    }
  });

const handleSubmit = (e) => {
  e.preventDefault();
  setFormErrors({}); // cleaning and deleting errors

  
  const { isValid, errors } = validateSignup({ name, email, password, confirmPassword, agreed });

// If any error is found in the entered data, transmission will stop.  
if (!isValid) {
    setFormErrors(errors);
    return;
  }

// Send only the data needed by the backend
  signupMutation.mutate({ name, email, password, location: "Gaza" });
};

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)] w-full font-sans mt-14 pb-10 md:pb-0">
          
          {/* Left Side - Hero */}
          <div
            className="relative hidden md:flex flex-1 items-center justify-center p-10"
            style={{
              backgroundImage: `url(${farmImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Dark overlay on Image */}
            <div className="absolute inset-0 bg-black/45" />

            {/* Text Image */}
            <div className="absolute inset-0 flex flex-col justify-center items-start text-left p-10 lg:p-20 z-10">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-medium tracking-tight text-white max-w-sm leading-snug mb-5 select-none">
                TerraVision AI - Advanced <br />
                Plant Management &amp; Health
                <br />
                Monitoring
              </h2>
              <div className="w-10 h-[3px] bg-[#2e9d4f] rounded" />
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex flex-1 justify-center bg-white px-4 sm:px-8 pt-12 md:pt-24 pb-12 items-start">
            <form onSubmit={handleSubmit} className="w-full max-w-md">
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                Create Your Account
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Join the future of intelligent agronomy today.
              </p>

              {/* General error message from the server, if any */}
              {formErrors.server && (
                <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
                  {formErrors.server}
                </div>
              )}

              {/* Full Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className={`flex items-center border rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-colors ${formErrors.name ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'}`}>
                  <UserIcon />
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {formErrors.name && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.name}</p>}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className={`flex items-center border rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-colors ${formErrors.email ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'}`}>
                  <EmailIcon />
                  <input
                    type="text"
                    placeholder="jane.doe@email.com"
                    className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {formErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.email}</p>}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className={`flex items-center border rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-colors ${formErrors.password ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'}`}>
                  <PasswordIcon />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    {showPassword ? <ShowPasswordIcon /> : <HidePasswordIcon />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className={`flex items-center border rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-colors ${formErrors.confirmPassword ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'}`}>
                  <PasswordIcon />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter password"
                    className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    {showConfirm ? <ShowPasswordIcon /> : <HidePasswordIcon />}
                  </button>
                </div>
                {formErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.confirmPassword}</p>}
              </div>

              {/* Terms */}
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={() => setAgreed(!agreed)}
                    className="w-4 h-4 accent-green-600 cursor-pointer"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-600 cursor-pointer select-none"
                  >
                    I agree to the{" "}
                    <span className="text-green-600 hover:underline cursor-pointer">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="text-green-600 hover:underline cursor-pointer">
                      Privacy Policy
                    </span>
                  </label>
                </div>
                {formErrors.agreed && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.agreed}</p>}
              </div>

              {/* Sign Up Button */}
              <button 
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-gradient-to-r from-[#2e9d4f] to-[#143d22] text-white font-semibold px-8 py-3.5 rounded-lg text-sm transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_15px_30px_-10px_rgba(20,61,34,0.4)] flex items-center justify-center gap-2"
              >
                {signupMutation.isPending ? 'Registering...' : 'Sign Up'}
              </button>

              {/* Log In Link */}
              <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{" "}
                <span className="text-green-600 font-medium hover:underline cursor-pointer">
                  Log In
                </span>
              </p>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}