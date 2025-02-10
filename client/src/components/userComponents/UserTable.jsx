import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import EditUser from "./EditUser";
import { UserContext } from "../../../context/userContext";
import CreateUser from "./CreateUser";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function UserTable() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);

  //  Modal states
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const containerRef = useRef(null);

  //  Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);

  // Total user calculations
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

  // Get all users on component mount
  useEffect(() => {
    axios
      .get("/users", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUsers(data);
        setSortedColumn("Display Name");
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
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

  //
  //  Modal Logic
  //

  // Submit user edit
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

  // Open edit modal
  const openEdit = async (id) => {
    if (id === user._id) {
      alert("Can't edit your own User.");
      setOpenDropdown(null);
    } else {
      setSelectedUser(id);
      setEditOpen(true);
      setOpenDropdown(null);
    }
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };

  // Close create modal
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

  // Delete selected user
  const deleteUser = async (id) => {
    if (id === user._id) {
      alert("Can't delete your own User.");
      setIsDeleteModalOpen(false);
      setOpenDropdown(null);
      return;
    }
    try {
      const res = await axios.delete(`/users/delete?userId=${id}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      });
      toast.success(res.data.message);
      setUsers(users.filter((user) => user._id !== id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete user:", error.response.data.message);
      toast.error("User not found");
      setIsDeleteModalOpen(false);
    }
  };

  //  Send confirmation email
  const sendEmail = async (userId) => {
    if (userId === user._id) {
      alert("Can't confirm your own user.");
      setOpenDropdown(null);
      return;
    }
    try {
      const res = await axios.post(
        "/users/sendconfirmation",
        { userId },
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      toast.success(res.data.message);
      setOpenDropdown(null);
    } catch (error) {
      console.log(error);
      toast.error("Error sending email...");
      setOpenDropdown(null);
    }
  };

  //
  //  Pagination Logic
  //

  // Calculate total number of pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Filter users based on search query
  useEffect(() => {
    const filteredUsers = users.filter((user) => {
      const query = searchQuery.toLowerCase();

      return (
        user.name.toLowerCase().includes(query) ||
        user._id.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query) ||
        user.company?.companyName.toLowerCase().includes(query) ||
        user.company?._id.toLowerCase().includes(query) ||
        user.createdAt.toLowerCase().includes(query) ||
        user.updatedAt.toLowerCase().includes(query) ||
        user.address?.street1?.toLowerCase().includes(query) ||
        user.address?.street2?.toLowerCase().includes(query) ||
        user.address?.city?.toLowerCase().includes(query) ||
        user.address?.state?.toLowerCase().includes(query) ||
        user.address?.country?.toLowerCase().includes(query) ||
        user.address?.zipCode?.toLowerCase().includes(query)
      );
    });
    setFilteredUsers(filteredUsers);
  }, [users, searchQuery]);

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-darkPrimary">
      {/* Edit user modal */}
      {isEditOpen && (
        <EditUser
          userId={selectedUser}
          onClose={handleCloseEdit}
          onSubmit={handleEditSubmit}
        />
      )}
      {/* Create user modal */}
      {isCreateOpen && (
        <CreateUser onClose={handleCloseCreate} onSubmit={handleCreateSubmit} />
      )}
      {/* Delete user modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center 
                      bg-gray-600 bg-opacity-50 dark:bg-gray-950 dark:bg-opacity-50 
                      overflow-y-auto"
        >
          <div
            className="relative w-fit shadow-lg rounded-md 
                        bg-gray-100 dark:bg-darkPrimary dark:text-white 
                         overflow-y-auto p-5"
          >
            <h3 className="text-lg font-bold">Confirm Delete</h3>
            <p>Are you sure you want to delete this user?</p>
            <div className="flex justify-end mt-4">
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={() => deleteUser(selectedUser)}
              >
                Delete
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded"
                onClick={() =>
                  setIsDeleteModalOpen(false) & setOpenDropdown(null)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User statistics header */}
      <div className="w-full p-5 bg-gray-200 flex justify-around items-center dark:bg-darkNavPrimary dark:text-white">
        <h2 className="text-xl font-bold">User Statistics</h2>
        <p className="text-sm">Sys-Admins: {systemAdminCount}</p>
        <p className="text-sm">Sys-Users: {systemUserCount}</p>
        <p className="text-sm">Comp-Admin: {companyAdminCount}</p>
        <p className="text-sm">Comp-User: {companyUserCount}</p>
        <p className="text-sm">Total Users: {users.length}</p>
      </div>
      {/* Search bar and create user button */}
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
      {/* User table */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <table className="w-full dark:text-white dark:bg-darkPrimary dark:border-border border-b-2">
          <thead className="border-b dark:border-border sticky top-0 z-10 bg-gray-200 dark:bg-darkNavSecondary select-none">
            <tr>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Display Name");
                  setFilteredUsers(
                    [...filteredUsers].sort((a, b) => {
                      if (a.displayName < b.displayName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.displayName > b.displayName)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Display Name
                {sortedColumn === "Display Name" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Name");
                  setFilteredUsers(
                    [...filteredUsers].sort((a, b) => {
                      if (a.name < b.name)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.name > b.name)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Name
                {sortedColumn === "Name" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Email");
                  setFilteredUsers(
                    [...filteredUsers].sort((a, b) => {
                      if (a.email < b.email)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.email > b.email)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Email
                {sortedColumn === "Email" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Role");
                  setFilteredUsers(
                    [...filteredUsers].sort((a, b) => {
                      if (a.role < b.role)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.role > b.role)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Role
                {sortedColumn === "Role" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Company");
                  setFilteredUsers(
                    [...filteredUsers].sort((a, b) => {
                      const nameA = a.company?.companyName || "";
                      const nameB = b.company?.companyName || "";

                      if (nameA < nameB) return newDirection === "asc" ? -1 : 1;
                      if (nameA > nameB) return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Company
                {sortedColumn === "Company" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>

              <th
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkNavPrimary"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Status");
                  setFilteredUsers(
                    [...filteredUsers].sort((a, b) => {
                      if (a.status < b.status)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.status > b.status)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Status
                {sortedColumn === "Status" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Display no users when there are no users */}
            {filteredUsers.length === 0 && (
              <tr
                key={user._id}
                className="border-b rounded hover:bg-gray-100 dark:hover:bg-darkNavSecondary dark:border-border text-center"
              >
                <td colSpan={7} className="py-4 text-center">
                  No users to display...
                </td>
              </tr>
            )}
            {/* Display user rows */}
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
                      {/* User Actions drop down */}
                      {openDropdown === user._id && (
                        <div
                          className="origin-top-right absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-gray-100 dark:bg-darkSecondary ring-1 ring-black ring-opacity-5 z-10 hover:cursor-pointer"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="menu-button"
                          tabIndex="-1"
                          ref={containerRef}
                        >
                          <div role="none">
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border rounded-t-md"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => openEdit(user._id)}
                            >
                              Edit
                            </a>
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-gray-200 dark:hover:bg-darkPrimary dark:border-border"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => sendEmail(user._id)}
                            >
                              Send Confirmation
                            </a>
                            <a
                              className=" block px-4 py-3 text-sm hover:bg-gray-200 rounded-b-md dark:hover:bg-darkPrimary dark:border-border"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() =>
                                setSelectedUser(user._id) &
                                setIsDeleteModalOpen(true) &
                                setOpenDropdown(false)
                              }
                            >
                              Delete
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {/* Pagination footer */}
        <div className="flex justify-between items-center dark:text-white">
          <div className="flex gap-3">
            <div>
              <select
                className="border rounded ml-2 dark:bg-darkSecondary dark:border-border"
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {paginationLevels.map((level, index) => (
                  <option key={index} value={level}>
                    {level}
                  </option>
                ))}
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
