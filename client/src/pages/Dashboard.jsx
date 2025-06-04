import { useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../context/userContext";
import UserAdminDashboard from "../components/userComponents/UserAdminDashboard";
import AdminDashboard from "../components/userComponents/AdminDashboard";

export default function Dashboard({ darkMode, toggleDarkMode }) {
  const { user, isLoading } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (
      user &&
      !isLoading &&
      location.pathname === "/dashboard" &&
      (user.role === "System_Admin" || user.role === "System_User")
    ) {
      navigate("/dashboard/admin/overview");
    } else if (
      user &&
      !isLoading &&
      location.pathname === "/dashboard" &&
      (user.role === "System_Admin" || user.role === "System_User")
    ) {
    }
  }, [user, isLoading, location.pathname, navigate]);

  useEffect(() => {
    localStorage.setItem("lastDashboardPath", window.location.pathname);
  }, []);

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-grow flex-col items-center w-full">
        {user?.role === "System_Admin" || user?.role === "System_User" ? (
          <AdminDashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        ) : user?.role === "Company_Admin" || user?.role === "Company_User" ? (
          <UserAdminDashboard
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
        ) : (
          <p>Role not recognized or user data incomplete</p>
        )}
      </div>
    </div>
  );
}
