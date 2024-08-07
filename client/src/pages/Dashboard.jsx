import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/userContext";
import UserAdminDashboard from "../components/userComponents/UserAdminDashboard";
import AdminDashboard from "../components/userComponents/AdminDashboard";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [userContextLoaded, setUserContextLoaded] = useState(false);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          setUserContextLoaded(true);
          const userData = await userDataCaller(user);
          setUserData(userData);
        } else {
          // Redirect to another page when the user is not defined
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false); // Stop loading after fetchUserData completes
      }
    };

    // Timeout needed during testing considering the dual api calls
    const timeoutId = setTimeout(() => {
      setLoading(false);
      fetchUserData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, navigate]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-grow flex-col items-center w-full">
        {userContextLoaded ? (
          userData.role === "System_Admin" ? (
            <AdminDashboard />
          ) : userData.role === "Company_Admin" ? (
            <UserAdminDashboard />
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
