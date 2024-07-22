import { useContext, useState, useEffect, navigate } from "react";
import { UserContext } from "../../context/userContext";
import toast from "react-hot-toast";
import EditProfile from "../components/userComponents/EditProfile";
import axios from "axios";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

export default function UserProfile() {
  const { user } = useContext(UserContext);
  const [userData, setUserData] = useState({});
  const [isEditOpen, setEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          userDataCaller(user);
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

  const userDataCaller = async (contextData) => {
    try {
      const response = await axios.get(
        `/profile/compute?id=${contextData._id}`
      );
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = () => {
    setEditOpen(!isEditOpen);
  };

  const handleUpdateUser = (updatedData) => {
    setUserData(updatedData.data);
    toast.success("User updated!");
    setEditOpen(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-50 w-full overflow-hidden">
      <Navbar />
      <div className="flex-grow flex items-center justify-center w-full px-4 ">
        <div className="bg-background-50 p-8 text-center w-full max-w-md shadow-lg bg-white rounded-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Your Profile
          </h1>
          <div className="space-y-4">
            <p className="flex justify-between items-center border-b border-gray-200 py-2">
              <strong className="font-semibold text-gray-700">
                Display Name:
              </strong>
              <span className="text-gray-600 ml-2">
                {userData.displayName || "N/A"}
              </span>
            </p>
            <p className="flex justify-between items-center border-b border-gray-200 py-2">
              <strong className="font-semibold text-gray-700">Name:</strong>
              <span className="text-gray-600 ml-2">
                {userData.name || "N/A"}
              </span>
            </p>
            <p className="flex justify-between items-center border-b border-gray-200 py-2">
              <strong className="font-semibold text-gray-700">Email:</strong>
              <span className="text-gray-600 ml-2">
                {userData.email || "N/A"}
              </span>
            </p>
            <p className="flex justify-between items-center border-b border-gray-200 py-2">
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
            <p className="flex justify-between items-center border-b border-gray-200 py-2">
              <strong className="font-semibold text-gray-700">Role:</strong>
              <span className="text-gray-600 ml-2">
                {userData.role || "N/A"}
              </span>
            </p>
            <p className="flex justify-between items-center border-b border-gray-200 py-2">
              <strong className="font-semibold text-gray-700">Company:</strong>
              <span className="text-gray-600 ml-2">
                {userData.company || "N/A"}
              </span>
            </p>
            <p className="flex justify-between items-center border-b border-gray-200 py-2">
              <strong className="font-semibold text-gray-700">
                Facilities:
              </strong>
              <span className="text-gray-600 ml-2">
                {userData.facilities?.length > 0
                  ? userData.facilities.join(", ")
                  : "N/A"}
              </span>
            </p>
            <p className="flex justify-between items-center border-b border-gray-200 py-2">
              <strong className="font-semibold text-gray-700">Address:</strong>
              <span className="text-gray-600 ml-2">{`${
                userData.address?.street1 || "N/A"
              } ${userData.address?.street2 || ""}, ${
                userData.address?.city || "N/A"
              }, ${userData.address?.state || "N/A"} ${
                userData.address?.zipCode || "N/A"
              }`}</span>
            </p>
            <button
              className="mt-5 bg-blue-600 text-white font-medium py-2 px-6 rounded-full hover:bg-blue-700 transition duration-300 shadow-md"
              onClick={handleEditToggle}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {isEditOpen && (
          <EditProfile
            user={userData}
            onClose={handleEditToggle}
            onSubmit={handleUpdateUser}
          />
        )}
      </div>
    </div>
  );
}
