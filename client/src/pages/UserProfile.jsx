import { useContext, useState } from "react";
import { UserContext } from "../../context/userContext";
import toast from "react-hot-toast";
import EditProfile from "../components/userComponents/EditProfile";
import Navbar from "../components/Navbar";

export default function UserProfile({ toggleDarkMode, darkMode }) {
  const { user } = useContext(UserContext);
  const [userData, setUserData] = useState({});
  const [isEditOpen, setEditOpen] = useState(false);

  const handleEditToggle = () => {
    setEditOpen(!isEditOpen);
  };

  const handleUpdateUser = (updatedData) => {
    setUserData(updatedData.data);
    toast.success("User updated!");
    setEditOpen(false);
  };

  return (
    <div className="flex flex-col h-screen dark:bg-darkPrimary dark:border-border text-black dark:text-white">
      <Navbar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
      <div className="flex flex-grow flex-col items-center w-full">
        <div className="space-y-4 m-auto">
          <h1 className="text-3xl text-center font-bold mb-6">Your Profile</h1>
          <p className="flex justify-between items-center border-b border-gray-200 py-2">
            <strong className="font-semibold">Display Name:</strong>
            <span className=" ml-2">{user?.displayName || "N/A"}</span>
          </p>
          <p className="flex justify-between items-center border-b border-gray-200 py-2">
            <strong className="font-semibold ">Name:</strong>
            <span className=" ml-2">{user?.name || "N/A"}</span>
          </p>
          <p className="flex justify-between items-center border-b border-gray-200 py-2">
            <strong className="font-semibold ">Email:</strong>
            <span className=" ml-2">{user?.email || "N/A"}</span>
          </p>
          <p className="flex justify-between items-center border-b border-gray-200 py-2">
            <strong className="font-semibold ">Email Confirmed:</strong>
            <span className=" ml-2">
              <input
                type="checkbox"
                id="confirmed"
                checked={user?.confirmed || false}
                disabled={true}
                className="mt-1"
              />
              <span className="ml-2 text-sm">
                {user?.confirmed ? "True" : "False"}
              </span>
            </span>
          </p>
          <p className="flex justify-between items-center border-b border-gray-200 py-2">
            <strong className="font-semibold ">Role:</strong>
            <span className=" ml-2">{user?.role || "N/A"}</span>
          </p>
          <p className="flex justify-between items-center border-b border-gray-200 py-2">
            <strong className="font-semibold ">Company:</strong>
            <span className=" ml-2">{user?.company || "N/A"}</span>
          </p>
          <p className="flex justify-between items-center border-b border-gray-200 py-2">
            <strong className="font-semibold ">Facilities:</strong>
            <span className=" ml-2">
              {user?.facilities?.length > 0
                ? user?.facilities.join(", ")
                : "N/A"}
            </span>
          </p>
          <p className="flex justify-between items-center border-b border-gray-200 py-2">
            <strong className="font-semibold ">Address:</strong>
            <span className=" ml-2">{`${user?.address?.street1 || "N/A"} ${
              user?.address?.street2 || ""
            }, ${user?.address?.city || "N/A"}, ${
              user?.address?.state || "N/A"
            } ${user?.address?.zipCode || "N/A"}`}</span>
          </p>
          <button
            className="mt-5 bg-blue-600 font-medium py-2 px-6 rounded-full hover:bg-blue-700 text-white transition duration-300 shadow-md float-right"
            onClick={handleEditToggle}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {isEditOpen && (
        <EditProfile
          user={user}
          onClose={handleEditToggle}
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  );
}
