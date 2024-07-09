import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/userContext";
import UserDashboard from "../components/userComponents/UserDashboard";
import AdminDashboard from "../components/userComponents/AdminDashboard";
import Navbar from "../components/Navbar";
import NotFound from "../components/NotFound";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const { user } = useContext(UserContext);
  const [userContextLoaded, setUserContextLoaded] = useState(false);
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          setUserContextLoaded(true);
          const userData = await userDataCaller(user);
          setUserData(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle error if needed
      }
    };

    fetchUserData();
  }, [user]);

  // Fetch userData
  const userDataCaller = async (contextData) => {
    try {
      const response = await axios.get(
        `/profile/compute?id=${contextData._id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-grow flex-col items-center w-full">
        {userContextLoaded ? (
          userData.role === "System_Admin" ? (
            <AdminDashboard />
          ) : userData.role ? (
            <UserDashboard />
          ) : (
            <p>Role not recognized or user data incomplete</p>
          )
        ) : (
          <LoadingSpinner />
        )}
      </div>
    </div>
  );
}
