import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { UserContextProvider } from "../context/userContext";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";
import { useState, useEffect } from "react";
import { HistoryProvider } from "../context/historyContext";
import RentalCheckout from "./components/rentalCenter/RentalCheckout";

axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:5000";
axios.defaults.withCredentials = true;

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedPreference = localStorage.getItem("darkMode");
    if (storedPreference === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  };

  return (
    <UserContextProvider>
      <HistoryProvider>
        <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route
            path="/dashboard/facility/:facilityId/:section?/:id?"
            element={
              <Dashboard toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route
            path="/dashboard/facility/:facilityId?/:section?"
            element={
              <Dashboard toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route
            path="/dashboard/:section/:id"
            element={
              <Dashboard toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route
            path="/dashboard/:section"
            element={
              <Dashboard toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <Dashboard toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route
            path="/users/:id"
            element={
              <UserProfile
                toggleDarkMode={toggleDarkMode}
                darkMode={darkMode}
              />
            }
          />
          <Route
            path="/register/:userId"
            element={
              <Register toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route path="/rental" element={<RentalCheckout />} />
          <Route path="/rental/:companyId" element={<RentalCheckout />} />
          <Route
            path="/rental/:companyId/:facilityId"
            element={<RentalCheckout />}
          />
          <Route
            path="/rental/:companyId/:facilityId/:unitId"
            element={<RentalCheckout />}
          />
          <Route
            path="/dashboard/:section"
            element={
              <Dashboard toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route
            path="/login"
            element={
              <Login toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route
            path="/"
            element={
              <Home toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
          <Route
            path="*"
            element={
              <NotFound toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            }
          />
        </Routes>
      </HistoryProvider>
    </UserContextProvider>
  );
}

export default App;
