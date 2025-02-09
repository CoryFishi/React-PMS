import { useContext } from "react";
import { UserContext } from "../../context/userContext";
import UserAdminDashboard from "../components/userComponents/UserAdminDashboard";
import AdminDashboard from "../components/userComponents/AdminDashboard";

export default function Dashboard({ darkMode, toggleDarkMode }) {
  const { user } = useContext(UserContext);

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
          <p onClick={() => console.log(user)}>
            Role not recognized or user data incomplete
          </p>
        )}
      </div>
    </div>
  );
}
