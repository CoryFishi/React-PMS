import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import EditUser from "./EditUser";
import { UserContext } from "../../../context/userContext";
import CreateUser from "./CreateUser";
import PaginationFooter from "../sharedComponents/PaginationFooter";
import DataTable from "../sharedComponents/DataTable";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import InputBox from "../sharedComponents/InputBox";
import ModalContainer from "../sharedComponents/ModalContainer";
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

  const handleColumnSort = (columnKey, accessor = (a) => a[columnKey]) => {
    let newDirection;

    if (sortedColumn !== columnKey) {
      newDirection = "asc";
    } else if (sortDirection === "asc") {
      newDirection = "desc";
    } else if (sortDirection === "desc") {
      newDirection = null;
    }

    setSortedColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);

    if (!newDirection) {
      setFilteredUsers([...users]);
      return;
    }

    const sorted = [...filteredUsers].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(sorted);
  };
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

  // Filter users based on search query
  useEffect(() => {
    const filteredUsers = users.filter((u) => {
      const query = searchQuery.toLowerCase();

      return (
        u.name.toLowerCase().includes(query) ||
        u._id.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.displayName.toLowerCase().includes(query) ||
        u.phone.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query) ||
        u.status.toLowerCase().includes(query) ||
        u.company?.companyName.toLowerCase().includes(query) ||
        u.company?._id.toLowerCase().includes(query) ||
        u.createdAt.toLowerCase().includes(query) ||
        u.updatedAt.toLowerCase().includes(query) ||
        u.address?.street1?.toLowerCase().includes(query) ||
        u.address?.street2?.toLowerCase().includes(query) ||
        u.address?.city?.toLowerCase().includes(query) ||
        u.address?.state?.toLowerCase().includes(query) ||
        u.address?.country?.toLowerCase().includes(query) ||
        u.address?.zipCode?.toLowerCase().includes(query)
      );
    });
    setFilteredUsers(filteredUsers);
  }, [searchQuery, users]);

  const columns = [
    {
      key: "displayName",
      label: "Display Name",
      accessor: (u) => u.displayName || "-",
    },
    {
      key: "name",
      label: "Name",
      accessor: (u) => u.name || "-",
    },
    {
      key: "email",
      label: "Email",
      accessor: (u) => u.email || "-",
    },
    {
      key: "role",
      label: "Role",
      accessor: (u) => u.role || "-",
    },
    {
      key: "company",
      label: "Company",
      accessor: (u) => u.company?.companyName || "-",
    },
    {
      key: "status",
      label: "Status",
      accessor: (u) => u.status || "-",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (user, index) => (
        <div
          className="relative inline-block text-left"
          key={index}
          ref={openDropdown === user._id ? containerRef : null}
        >
          <div>
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 items-center"
              onClick={() =>
                setOpenDropdown((prev) => (prev === user._id ? null : user._id))
              }
            >
              {openDropdown === user._id ? (
                <IoMdArrowDropdown />
              ) : (
                <IoMdArrowDropup />
              )}
              Actions
            </button>
          </div>
          {/* User Actions drop down */}
          {openDropdown === user._id && (
            <div
              className="origin-top-right absolute right-0 mt-1 w-56 flex flex-col rounded shadow-lg bg-zinc-100 dark:bg-zinc-800 border dark:border-zinc-600 ring-1 ring-black/5 z-10 hover:cursor-pointer"
              ref={containerRef}
            >
              <a
                className="px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-800 rounded-t"
                onClick={() => openEdit(user._id)}
              >
                Edit User
              </a>
              <a
                className="px-4 py-3 hover:bg-zinc-200 dark:hover:bg-zinc-900 dark:border-zinc-800"
                onClick={() => sendEmail(user._id)}
              >
                Send Email Confirmation
              </a>
              <a
                className="px-4 py-3 hover:bg-zinc-200 rounded-b dark:hover:bg-zinc-900 dark:border-zinc-800"
                onClick={() =>
                  setSelectedUser(user._id) &
                  setIsDeleteModalOpen(true) &
                  setOpenDropdown(false)
                }
              >
                Delete User
              </a>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-zinc-900">
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
                      bg-zinc-600/50 dark:bg-zinc-950/50 
                      overflow-y-auto"
        >
          <ModalContainer
            title={`Delete ${selectedUser}`}
            mainContent={
              <p className="pt-2">Are you sure you want to delete this user?</p>
            }
            responseContent={
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-red-700 focus:outline-none focus:border-zinc-700 focus:ring focus:ring-zinc-200 transition ease-in duration-200"
                  onClick={() => deleteUser(selectedUser)}
                >
                  Delete
                </button>
                <button
                  className="px-4 py-2 bg-zinc-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-zinc-700 focus:outline-none focus:border-zinc-700 focus:ring focus:ring-zinc-200 transition ease-in duration-200"
                  onClick={() =>
                    setIsDeleteModalOpen(false) & setOpenDropdown(null)
                  }
                >
                  Cancel
                </button>
              </div>
            }
          />
        </div>
      )}
      {/* User statistics header */}
      <div className="w-full p-5 bg-zinc-200 flex justify-around items-center dark:bg-zinc-950 dark:text-white">
        <h2 className="text-xl font-bold">User Statistics</h2>
        <p className="text-sm">Sys-Admins: {systemAdminCount}</p>
        <p className="text-sm">Sys-Users: {systemUserCount}</p>
        <p className="text-sm">Comp-Admin: {companyAdminCount}</p>
        <p className="text-sm">Comp-User: {companyUserCount}</p>
        <p className="text-sm">Total Users: {users.length}</p>
      </div>
      {/* Search bar and create user button */}
      <div className="my-4 flex items-center justify-end text-center mx-5 gap-2">
        <InputBox
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
          placeholder={"Search users..."}
        />

        <button
          className="bg-blue-600 text-white h-full p-1 py-2 rounded-lg hover:bg-blue-700 w-44 font-bold"
          onClick={() => setCreateOpen(true)}
        >
          Create User
        </button>
      </div>
      {/* User table */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <DataTable
          columns={columns}
          data={filteredUsers}
          currentPage={currentPage}
          rowsPerPage={itemsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
        {/* Pagination footer */}
        <div className="px-2 py-5 mx-1">
          <PaginationFooter
            rowsPerPage={itemsPerPage}
            setRowsPerPage={setItemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            items={filteredUsers}
          />
        </div>
      </div>
    </div>
  );
}
