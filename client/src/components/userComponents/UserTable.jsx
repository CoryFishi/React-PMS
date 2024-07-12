import axios from "axios";
import { useState, useEffect, useRef, useContext } from "react";
import toast from "react-hot-toast";
import EditUser from "./EditUser";
import { UserContext } from "../../../context/userContext";
import CreateUser from "./CreateUser";

export default function UserTable() {
  // Root user
  const { user } = useContext(UserContext);
  // Needed to store this in a new variable name
  const rootUser = user;
  // Users
  const [users, setUsers] = useState([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // Open/close dropdown
  const [openDropdown, setOpenDropdown] = useState(null);
  // Edit user popup
  const [isEditOpen, setEditOpen] = useState(false);
  // Delete user popup
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Stored UserId to delete
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  // Create modal
  const [isCreateOpen, setCreateOpen] = useState(false);
  // Ref so actions menu closes on outside click
  const containerRef = useRef(null);

  // Calculate the number of users with the 'user' role
  const companyUserCount = users.filter(
    (user) => user.role === "Company_User"
  ).length;
  // Calculate the number of users with the 'admin' role
  const companyAdminCount = users.filter(
    (user) => user.role === "Company_Admin"
  ).length;
  // Calculate the number of users with the 'admin' role
  const systemAdminCount = users.filter(
    (user) => user.role === "System_Admin"
  ).length;
  // Calculate the number of users with the 'admin' role
  const systemUserCount = users.filter(
    (user) => user.role === "System_User"
  ).length;

  // Update users table on change
  useEffect(() => {
    axios.get("/users").then(({ data }) => {
      setUsers(data);
    });
  }, []);
  // Handler to close dropdown if clicking outside of the dropdown area
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    }
    // Add event listener when a dropdown is open
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // Delete modal logic
  const promptDeleteUser = (id) => {
    setUserIdToDelete(id);
    setIsDeleteModalOpen(true);
  };
  // Submit edit
  const handleEditSubmit = (e) => {
    toast.success("User updated!");
    setEditOpen(false);
    const updatedUsers = users.map((user) => {
      if (user._id === e.data._id) {
        return { ...user, ...e.data };
      }
      return user;
    });
    setUsers(updatedUsers);
  };
  // Delete selected user
  const deleteUser = async (id) => {
    if (id === rootUser._id) {
      alert("Can't delete your own User.");
      setIsDeleteModalOpen(false);
      setOpenDropdown(null);
      return;
    }
    try {
      const res = await axios.delete(`/users/delete?userId=${id}`);
      toast.success(res.data.message);
      setUsers(users.filter((user) => user._id !== id));
      setIsDeleteModalOpen(false); // Close the modal
    } catch (error) {
      console.error("Failed to delete user:", error.response.data.message);
      toast.error("User not found");
      setIsDeleteModalOpen(false); // Close the modal on error as well
    }
  };
  // Send email to selected user
  const sendEmail = async (userId) => {
    if (userId === rootUser._id) {
      alert("Can't confirm your own user.");
      setOpenDropdown(null);
      return;
    }
    try {
      const res = await axios.post("/users/sendconfirmation", { userId });
      toast.success(res.data.message);
      setOpenDropdown(null);
    } catch (error) {
      console.log(error);
      toast.error("Error sending email...");
      setOpenDropdown(null);
    }
  };
  // Open edit modal
  const openEdit = (id) => {
    if (id === rootUser._id) {
      alert("Can't edit your own User.");
      setOpenDropdown(null);
    } else {
      setEditOpen(true);
    }
  };
  // Close edit modal
  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };
  const handleCloseCreate = () => {
    setCreateOpen(false);
    setOpenDropdown(null);
  };
  // Submit create
  const handleCreateSubmit = (e) => {
    toast.success("User created!");
    setCreateOpen(false);
    const updatedUsers = [...users, e.data];
    setUsers(updatedUsers);
    setOpenDropdown(null);
  };

  // Calculate the indices of the users to display on the current page
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  // Function to handle page changes
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(users.length / itemsPerPage);

  return (
    <>
      <div className="w-full p-5 bg-background-100 flex justify-around items-center mb-2 text-text-950 rounded-lg">
        <h2 className="text-xl font-bold">User Statistics</h2>
        <p className="text-sm">Sys-Admins: {systemAdminCount}</p>
        <p className="text-sm">Sys-Users: {systemUserCount}</p>
        <p className="text-sm">Comp-Admin: {companyAdminCount}</p>
        <p className="text-sm">Comp-User: {companyUserCount}</p>
        <p className="text-sm">Total Users: {users.length}</p>
      </div>
      <div className="flex justify-end">
        <button
          className="block w-32 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 mr-10"
          onClick={() => setCreateOpen(true)}
        >
          Create User
        </button>
      </div>

      {isCreateOpen && (
        <CreateUser onClose={handleCloseCreate} onSubmit={handleCreateSubmit} />
      )}
      <div className="container mx-auto p-4 mb-5 shadow-lg rounded-lg bg-white">
        <table className="min-w-full table-auto bg-background-100 rounded-md">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {currentUsers.map((user) => (
              <tr
                key={user._id}
                className="border-b bg-white rounded text-text-950"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {user.displayName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {user?.company?.companyName ?? "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {user.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className="relative inline-block text-left">
                    <div>
                      <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-primary-500 text-sm font-medium text-white hover:bg-secondary-500"
                        onClick={() =>
                          setOpenDropdown((prev) =>
                            prev === user._id ? null : user._id
                          )
                        }
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                        Actions
                      </button>
                    </div>
                    {openDropdown === user._id && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background-100 ring-1 ring-black ring-opacity-5 z-10"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="menu-button"
                        tabIndex="-1"
                        ref={containerRef}
                      >
                        <div className="py-1" role="none">
                          <a
                            className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                            role="menuitem"
                            tabIndex="-1"
                            onClick={() => openEdit(user._id)}
                          >
                            Edit
                          </a>
                          <a
                            className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                            role="menuitem"
                            tabIndex="-1"
                            onClick={() => sendEmail(user._id)}
                          >
                            Send Confirmation
                          </a>
                          {isEditOpen && (
                            <EditUser
                              userId={user._id}
                              onClose={handleCloseEdit}
                              onSubmit={handleEditSubmit}
                            />
                          )}
                          <a
                            className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                            role="menuitem"
                            tabIndex="-1"
                            onClick={() => promptDeleteUser(user._id)}
                          >
                            Delete
                          </a>
                          {isDeleteModalOpen && (
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                              <div className="bg-background-100 p-4 rounded-lg shadow-lg">
                                <h3 className="text-lg font-bold">
                                  Confirm Delete
                                </h3>
                                <p>
                                  Are you sure you want to delete this user?
                                </p>
                                <div className="flex justify-end mt-4">
                                  <button
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                                    onClick={() => deleteUser(userIdToDelete)}
                                  >
                                    Delete
                                  </button>
                                  <button
                                    className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded"
                                    onClick={() =>
                                      setIsDeleteModalOpen(false) &
                                      setOpenDropdown(null)
                                    }
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-center mt-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="mx-1 px-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
          >
            {"<"}
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`mx-1 px-3 py-1 rounded text-primary-500}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="mx-1 px-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
          >
            {">"}
          </button>
        </div>
      </div>
    </>
  );
}
