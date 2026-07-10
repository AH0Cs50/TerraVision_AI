import React, { useEffect, useState } from "react";

import Sidebar from "../../components/layout/Sidebar";
import DashboardHeader from "../../components/layout/DashboardHeader";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getProfile, updateProfile } from "../../api/userApi";

import { useAuthStore } from "../../store/authStore";
import { Link, useNavigate } from "react-router-dom";

import { validateProfile } from "../../validation/userValidator";
import { Check, MapPin, ShieldCheck, UserRoundPlus } from "lucide-react";

const ProfileSettings = () => {
  const user = useAuthStore((state) => state.user);

  const [errors, setErrors] = useState({});
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    type: "",
    message: "",
    showLogin: false,
  });

  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // Retrieve user data
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile", user?.uuid],
    queryFn: () => getProfile(user.uuid),
    enabled: !!user?.uuid,
  });

  //  Filling in the fields
  useEffect(() => {
    if (!data) return;

    setFormData({
      name: data.name || "",
      email: data.email || "",
    });
  }, [data]);

  // Data update
  const updateMutation = useMutation({
    mutationFn: (payload) => updateProfile(user.uuid, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", user.uuid],
      });

      setStatus({
        type: "success",
        message: "Profile updated successfully.",
        showLogin: true,
      });
    },

    onError: (error) => {
      console.log("Mutation Error:", error);

      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile.",
        showLogin: false,
      });
    },
  });

  // handle Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Handle Save
  const handleSubmit = () => {
    const errors = validateProfile(formData);

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    updateMutation.mutate(formData);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Sidebar Section */}
      <Sidebar />

      {/* Main Content Dynamic Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto pl-12 pr-6 py-8 w-full font-sans text-gray-800">
          {/* Title Section */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3D24]">
              Settings
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage your account preferences and global farm coordinates.
            </p>
          </div>

          <div className="space-y-6">
            {/* Section 1: Account & Security */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center gap-2 text-[#0A3D24] font-bold text-base sm:text-lg mb-6">
                <UserRoundPlus className="w-5 h-5" />
                <h3>Account & Security</h3>
              </div>

              {/* Profile Photo Banner */}
              <div className="relative bg-[#1B4D3E] rounded-xl p-6 flex items-center gap-4 mb-6 text-white overflow-hidden">
                <div className="relative w-13 sm:w-20 h-20 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm sm:text-base">
                    Profile Photo
                  </h4>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Update your professional avatar
                  </p>
                </div>
              </div>

              {/* Input Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    /*       value={formData.name} */
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A3D24] transition"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Password
                    </label>

                    {/*                     <button
                      type="button"
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      Change
                    </button> */}
                    <Link to="/user/change_password">
                      <span className="text-xs font-bold text-emerald-600 hover:underline">
                        Change
                      </span>
                    </Link>
                  </div>

                  <input
                    type="password"
                    defaultValue="••••••••"
                    className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A3D24] transition"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Account Status
                  </label>
                  <div className="flex items-center gap-2 bg-[#E8F5E9] text-[#2E7D32] font-semibold text-sm rounded-xl px-4 py-3 border border-[#C8E6C9]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Account Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Location Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center gap-2 text-[#0A3D24] font-bold text-base sm:text-lg mb-6">
                <MapPin className="w-5 h-5" />

                <h3>Location Settings</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Primary City
                    </label>
                    <input
                      type="text"
                      defaultValue="Gaza Strip, Deir Al-Balah"
                      className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A3D24] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      defaultValue="31.4177° N"
                      className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A3D24] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      defaultValue="34.3501° E"
                      className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A3D24] transition"
                    />
                  </div>
                </div>

                {/* Map */}
                <div className="w-full h-56 lg:h-full min-h-[220px] bg-[#E4E9F0] rounded-xl overflow-hidden border border-gray-200 relative">
                  <iframe
                    title="Farm Location"
                    src="https://maps.google.com/maps?q=Deir%20al%20Balah&t=&z=13&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-none grayscale-[20%] contrast-[110%]"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    name: data.name,
                    email: data.email,
                  })
                }
                className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
              >
                Discard Changes
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="bg-[#0A3D24]
             hover:bg-[#062617]
             disabled:opacity-60
             text-white
             font-semibold
             text-sm
             px-6
             py-2.5
             rounded-xl
             flex
             items-center
             gap-2
             shadow-sm
             transition"
              >
                {updateMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
            {status.message && (
              <div
                className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                  status.type === "success"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-red-50 border-red-300 text-red-700"
                }`}
              >
                <p>{status.message}</p>

                {status.showLogin && (
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="mt-2 font-semibold underline"
                  >
                    Login again
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileSettings;
