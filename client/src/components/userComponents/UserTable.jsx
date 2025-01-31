import axios from "axios";
import { useState, useEffect, useRef, useContext } from "react";
import toast from "react-hot-toast";
import EditUser from "./EditUser";
import { UserContext } from "../../../context/userContext";
import CreateUser from "./CreateUser";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function UserTable() {
  const { user } = useContext(UserContext);
  const rootUser = user;
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Totale user calculations
  const companyUserCount = users.filter(
    (user) => user.role === "Company_User"
  ).length;
  const companyAdminCount = users.filter(
    (user) => user.role === "Company_Admin"
  ).length;
  const systemAdminCount = users.filter(
    (user) => user.role === "System_Admin"
  ).length;
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

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  useEffect(() => {
    const filteredUsers = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.company?.companyName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filteredUsers);
  }, [users, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-darkPrimary">
      <div className="w-full p-5 bg-gray-200 flex justify-around items-center dark:bg-darkNavPrimary dark:text-white">
        <h2 className="text-xl font-bold">User Statistics</h2>
        <p className="text-sm">Sys-Admins: {systemAdminCount}</p>
        <p className="text-sm">Sys-Users: {systemUserCount}</p>
        <p className="text-sm">Comp-Admin: {companyAdminCount}</p>
        <p className="text-sm">Comp-User: {companyUserCount}</p>
        <p className="text-sm">Total Users: {users.length}</p>
      </div>
      <div className="my-4 flex items-center justify-end text-center mx-5">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          className="border dark:text-white p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <button
          className="bg-blue-500 text-white p-1 py-2 rounded hover:bg-blue-700 ml-3 w-44 font-bold"
          onClick={() => setCreateOpen(true)}
        >
          Create User
        </button>
      </div>

      {isCreateOpen && (
        <CreateUser onClose={handleCloseCreate} onSubmit={handleCreateSubmit} />
      )}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
          <thead className="sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary">
            <tr>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((user, index) => (
                <tr
                  key={user._id}
                  className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border"
                >
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {user.displayName}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {user.name}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {user.email}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {user.role}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {user?.company?.companyName ?? "-"}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    {user.status}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-center">
                    <div className="relative inline-block text-left">
                      <div>
                        <button
                          type="button"
                          className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-500 text-sm font-medium text-white hover:bg-blue-700"
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
                          className="origin-top-right absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-gray-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="menu-button"
                          tabIndex="-1"
                          ref={containerRef}
                        >
                          <div className="py-1" role="none">
                            <a
                              className=" block px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => openEdit(user._id)}
                            >
                              Edit
                            </a>
                            <a
                              className=" block px-4 py-2 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border"
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
                              className=" block px-4 py-2 text-sm hover:bg-gray-200 rounded-b-md dark:hover:bg-darkPrimary dark:border-border"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => promptDeleteUser(user._id)}
                            >
                              Delete
                            </a>
                            {isDeleteModalOpen && (
                              <div className="fixed inset-0 dark:bg-gray-950 dark:bg-opacity-50 bg-opacity-50  bg-gray-600 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                                <div className="bg-gray-200 dark:bg-darkPrimary dark:text-white p-4 rounded-lg shadow-lg">
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
        <div className="flex justify-between items-center dark:text-white">
          <div className="flex gap-3">
            <div>
              <select
                className="border rounded ml-2 dark:bg-darkSecondary dark:border-border"
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page on rows per page change
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <p className="text-sm">
              {currentPage === 1 ? 1 : (currentPage - 1) * itemsPerPage + 1} -{" "}
              {currentPage * itemsPerPage > filteredUsers.length
                ? filteredUsers.length
                : currentPage * itemsPerPage}{" "}
              of {filteredUsers.length}
            </p>
          </div>
          <div className="px-2 py-5 mx-1">
            <div className="gap-2 flex">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronsLeft />
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronLeft />
              </button>
              <p>
                {currentPage} of {totalPages}
              </p>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronRight />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronsRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
