import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import "../fleet-data.js";
import "../admin-data.js";
import { FleetProvider } from "./context/FleetContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Admin from "./pages/Admin.jsx";

function App() {
  return <BrowserRouter><AuthProvider><FleetProvider><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/index.html" element={<Home />} />
    <Route path="/login.html" element={<Login />} />
    <Route path="/signup.html" element={<Signup />} />
    <Route path="/admin.html" element={<Admin />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></FleetProvider></AuthProvider></BrowserRouter>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
