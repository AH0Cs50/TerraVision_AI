import React, { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";
import { useMutation } from "@tanstack/react-query";
import { changePasswordRequest } from "../../api/authApi";

import { validateChangePassword } from "../../validation/authValidator";
import { Eye, EyeOff } from "lucide-react";

const ChangePassword = () => {
  // Input storage cases
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password display/hide settings
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Convert error status to an object to accommodate errors in each field individually
  const [formErrors, setFormErrors] = useState({});

  // 4. Definition of useMutation
  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: (data) => {
      console.log("Password updated successfully:", data);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setFormErrors({});
    },
    onError: (err) => {
      console.error("Error updating password:", err);
    },
  });

  // A function to update the input values ​​while writing and filter the error of the read field
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name]) {
      setFormErrors({ ...formErrors, [e.target.name]: "" });
    }
  };

  // Form submission function to activate Validator
  const handleSubmit = (e) => {
    e.preventDefault();

    // Enable imported external verification
    const { isValid, errors } = validateChangePassword(formData);

    if (!isValid) {
      setFormErrors(errors); // Saving errors for display in the interface
      return;
    }

    // Submit the request if the test is successful
    mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  const getPasswordStrength = (password) => {
    if (!password) return { text: "None", score: 0, color: "text-gray-400" };

    let score = 0;

    // Protection conditions (taken from your Validator)
    if (password.length >= 8) score++; // First condition: height
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++; // Second condition: Capital and lowercase letters
    if (/\d/.test(password)) score++; // Third condition: numbers or symbols

    // Determine the word and color based on the result
    if (score === 1 || password.length < 6) {
      return {
        text: "Weak",
        score: 1,
        color: "text-red-500",
        barColor: "bg-red-500",
      };
    }
    if (score === 2) {
      return {
        text: "Medium",
        score: 2,
        color: "text-amber-500",
        barColor: "bg-amber-500",
      };
    }
    if (score === 3) {
      return {
        text: "Strong",
        score: 3,
        color: "text-emerald-600",
        barColor: "bg-[#1B4D3E]",
      };
    }

    return {
      text: "Weak",
      score: 1,
      color: "text-red-500",
      barColor: "bg-red-500",
    };
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-x-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto pl-12 pr-6 py-8 w-full bg-[#F9FAFB]">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 font-medium">
            <span className="hover:underline cursor-pointer">Settings</span>
            <span>&rsaquo;</span>
            <span className="hover:underline cursor-pointer">
              Account & Security
            </span>
            <span>&rsaquo;</span>
            <span className="text-gray-800 font-semibold underline">
              Change Password
            </span>
          </div>

          <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.03)] p-6 sm:p-10 lg:p-12">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A3D24]">
                Update Password
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Ensure your account is using a long, random password to stay
                secure.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
              {/* 1. CURRENT PASSWORD */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition pr-10 ${
                      formErrors.currentPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#0A3D24] focus:ring-[#0A3D24]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {formErrors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {formErrors.currentPassword}
                  </p>
                )}
              </div>

              {/*  New Password */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition pr-10 ${
                      formErrors.newPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#0A3D24] focus:ring-[#0A3D24]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}{" "}
                  </button>
                </div>
                {formErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {formErrors.newPassword}
                  </p>
                )}
              </div>

              {formData.newPassword && (
                <div className="space-y-1.5 transition-all duration-300">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-gray-400">Password Strength</span>
                    {/* Dynamically recalling text and color*/}

                    <span
                      className={
                        getPasswordStrength(formData.newPassword).color
                      }
                    >
                      {getPasswordStrength(formData.newPassword).text}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Tape 1 */}
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        getPasswordStrength(formData.newPassword).score >= 1
                          ? getPasswordStrength(formData.newPassword).barColor
                          : "bg-gray-100"
                      }`}
                    ></div>
                    {/* Tape 2 */}
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        getPasswordStrength(formData.newPassword).score >= 2
                          ? getPasswordStrength(formData.newPassword).barColor
                          : "bg-gray-100"
                      }`}
                    ></div>

                    {/* Tape 3 */}
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        getPasswordStrength(formData.newPassword).score >= 3
                          ? getPasswordStrength(formData.newPassword).barColor
                          : "bg-gray-100"
                      }`}
                    ></div>
                  </div>
                </div>
              )}

              {/*    Confirm New Password  */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat new password"
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition pr-10 ${
                      formErrors.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-[#0A3D24] focus:ring-[#0A3D24]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}{" "}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* PASSWORD BEST PRACTICES BOX */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 leading-relaxed">
                <p className="font-bold text-gray-700 mb-1">
                  PASSWORD BEST PRACTICES
                </p>
                For a strong password, we recommend using at least 8 characters
                including a mix of uppercase letters, numbers, and special
                symbols.
              </div>

              {/* Server error messages or overall success */}
              {error && (
                <div className="text-red-500 text-xs font-semibold">
                  {error?.response?.data?.message ||
                    "Something went wrong. Please try again."}
                </div>
              )}
              {isSuccess && (
                <div className="text-emerald-600 text-xs font-semibold">
                  Password updated successfully!
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#0A3D24] hover:bg-[#062617] disabled:bg-gray-400 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition transform active:scale-[0.98]"
                >
                  {isPending ? "Saving..." : "Save New Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setFormErrors({});
                  }}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChangePassword;
