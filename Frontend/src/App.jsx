import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";

//  Dashboard
import EmptyDashboard from "./pages/dashboard/EmptyDashboard";
import AddPlant from "./pages/dashboard/AddPlant";
import Dashboard from "./pages/dashboard/Dashboard";
import MyGarden from "./pages/dashboard/MyGarden";

//  Settings
import ProfileSettings from "./pages/settings/ProfileSettings";
import ChangePassword from "./pages/settings/ChangePassword";

//  Plant Details
import PlantDetailHealthy from "./pages/dashboard/plant_detail/PlantDetailHealthy";
import PlantDetailInfected from "./pages/dashboard/plant_detail/PlantDetailInfected";

import SmartScan from "./pages/SmartScan";
import RoutineScanPage from "./pages/RoutineScanPage";

// Protected Route
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Dashboard */}
        <Route
          path="/dashboard/empty_dashboard"
          element={
            <ProtectedRoute>
              <EmptyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/add_plant"
          element={
            <ProtectedRoute>
              <AddPlant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/my_garden"
          element={
            <ProtectedRoute>
              <MyGarden />
            </ProtectedRoute>
          }
        />{" "}
        {/* Settings */}
        <Route
          path="/user/Settings"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/change_password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        {/* Plant Details */}
 {/* Plant Details */}
<Route
  path="/plant/healthy/:uuid"
  element={
    <ProtectedRoute>
      <PlantDetailHealthy />
    </ProtectedRoute>
  }
/>
<Route
  path="/plant/infected/:uuid"
  element={
    <ProtectedRoute>
      <PlantDetailInfected />
    </ProtectedRoute>
  }
/>
<Route
  path="/plant/routine-scan/:uuid"
  element={
    <ProtectedRoute>
      <RoutineScanPage />
    </ProtectedRoute>
  }
/>
        {/* Scan plant */}
        <Route path="/smart_scan" element={<SmartScan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
