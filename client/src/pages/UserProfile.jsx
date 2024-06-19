import { useContext, useState, useEffect } from "react";
import { UserContext } from "../../context/userContext";
import toast from "react-hot-toast";
import EditProfile from "../components/userComponents/EditProfile";
import axios from "axios";
import Navbar from "../components/Navbar"

export default function UserProfile() {
  const { user } = useContext(UserContext);
  const [userContextLoaded, setUserContextLoaded] = useState(false);
  const [userData, setUserData] = useState([]);
  const [isEditOpen, setEditOpen] = useState(false);

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

  // Open edit modal
  const openEdit = () => {
    setEditOpen(true);
  };
  // Close edit modal
  const handleCloseEdit = () => {
    setEditOpen(false);
  };
  // Update user data
  function updateUser(userData) {
    // Update the user data in your context
    setUser(userData);
  }
  const handleSubmit = (e) => {
    toast.success("User updated!");
    updateUser(e.data);
    // console.log(e.data);
    setEditOpen(false);
  };
  return (
    <>
    <Navbar />
      <div className="mt-5 flex items-center justify-center w-full">
        {userContextLoaded ? (
          <div className="bg-white rounded-xl shadow-lg p-20 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Your Profile
            </h1>
            <div className="space-y-4">
              <p>
                <strong className="font-semibold text-gray-700">
                  Display Name:
                </strong>
                <span className="text-gray-600 ml-2">
                  {userData.displayName || "N/A"}
                </span>
              </p>
              <p>
                <strong className="font-semibold text-gray-700">Name:</strong>
                <span className="text-gray-600 ml-2">
                  {userData.name || "N/A"}
                </span>
              </p>
              <p>
                <strong className="font-semibold text-gray-700">Email:</strong>
                <span className="text-gray-600 ml-2">
                  {userData.email || "N/A"}
                </span>
              </p>
              <p>
                <strong className="font-semibold text-gray-700">
                  Email Confirmed:
                </strong>
                <span className="text-gray-600 ml-2">
                  <input
                    type="checkbox"
                    id="confirmed"
                    checked={userData.confirmed || false}
                    disabled={true}
                    className="mt-1"
                  />
                  <span className="ml-2 text-sm">
                    {userData.confirmed ? "True" : "False"}
                  </span>
                </span>
              </p>
              <p>
                <strong className="font-semibold text-gray-700">Role:</strong>
                <span className="text-gray-600 ml-2">
                  {userData.role || "N/A"}
                </span>
              </p>
              <button
                className="mt-5 bg-blue-500 text-white font-medium py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                onClick={openEdit}
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          // Render a loading indicator or placeholder content while waiting for user context
          <p>Loading...</p>
        )}
        {isEditOpen && (
          <EditProfile
            user={userData}
            onClose={handleCloseEdit}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </>
  );
}
