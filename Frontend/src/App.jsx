import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";

// Dashboard
import EmptyDashboard from "./pages/dashboard/EmptyDashboard";
import AddPlant from "./pages/dashboard/AddPlant";
import Dashboard from "./pages/dashboard/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Dashboard */}
        <Route path="/empty_dashboard" element={<EmptyDashboard />} />
        <Route path="/add_plant" element={<AddPlant />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
