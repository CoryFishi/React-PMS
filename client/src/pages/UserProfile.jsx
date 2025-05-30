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
    <div className="flex flex-col h-screen dark:bg-zinc-900 text-black dark:text-white">
      {isEditOpen && (
        <EditProfile
          user={user}
          onClose={handleEditToggle}
          onSubmit={handleUpdateUser}
        />
      )}
      <Navbar toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
      <div className="flex flex-grow flex-col items-center w-full">
        <div className="space-y-4 m-auto">
          <h1 className="text-3xl text-center font-bold mb-6">Your Profile</h1>
          <p className="flex justify-between items-center border-b-2 border-zinc-200 dark:border-zinc-700 py-2">
            <strong className="font-semibold">Display Name:</strong>
            <span className=" ml-2">
              {userData?.displayName || user?.displayName || "N/A"}
            </span>
          </p>
          <p className="flex justify-between items-center border-b-2 border-zinc-200 dark:border-zinc-700 py-2">
            <strong className="font-semibold ">Name:</strong>
            <span className=" ml-2">
              {userData?.name || user?.name || "N/A"}
            </span>
          </p>
          <p className="flex justify-between items-center border-b-2 border-zinc-200 dark:border-zinc-700 py-2">
            <strong className="font-semibold ">Email:</strong>
            <span className=" ml-2">
              {userData?.email || user?.email || "N/A"}
            </span>
          </p>
          <p className="flex justify-between items-center border-b-2 border-zinc-200 dark:border-zinc-700 py-2">
            <strong className="font-semibold ">Email Confirmed:</strong>
            <span className=" ml-2">
              <input
                type="checkbox"
                id="confirmed"
                checked={userData?.confirmed || user?.confirmed || false}
                disabled={true}
                className="mt-1"
              />
              <span className="ml-2 text-sm">
                {userData?.confirmed || user?.confirmed ? "True" : "False"}
              </span>
            </span>
          </p>
          <p className="flex justify-between items-center border-b-2 border-zinc-200 dark:border-zinc-700 py-2">
            <strong className="font-semibold ">Role:</strong>
            <span className=" ml-2">
              {userData?.role || user?.role || "N/A"}
            </span>
          </p>
          <p className="flex justify-between items-center border-b-2 border-zinc-200 dark:border-zinc-700 py-2">
            <strong className="font-semibold ">Company:</strong>
            <span className=" ml-2">
              {userData?.company || user?.company || "N/A"}
            </span>
          </p>
          <p className="flex justify-between items-center border-b-2 border-zinc-200 dark:border-zinc-700 py-2">
            <strong className="font-semibold ">Facilities:</strong>
            <span className=" ml-2">
              {userData?.facilities?.length || user?.facilities?.length > 0
                ? user?.facilities.join(", ")
                : "N/A"}
            </span>
          </p>
          <p className="flex justify-between items-center border-b-2 border-zinc-200 dark:border-zinc-700 py-2">
            <strong className="font-semibold ">Address:</strong>
            <span className=" ml-2">{`${
              userData?.address?.street1 || user?.address?.street1 || "N/A"
            } ${userData?.address?.street2 || user?.address?.street2 || ""}, ${
              userData?.address?.city || user?.address?.city || "N/A"
            }, ${userData?.address?.state || user?.address?.state || "N/A"} ${
              userData?.address?.zipCode || user?.address?.zipCode || "N/A"
            }`}</span>
          </p>
          <button
            className="mt-5 bg-blue-600 font-medium py-2 px-6 rounded-lg hover:bg-blue-700 text-white transition shadow-md float-right hover:scale-105 duration-300"
            onClick={handleEditToggle}
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
