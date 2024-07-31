import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import CreateTenantTenantPage from "../tenantComponents/CreateTenantTenantPage";
import EditTenant from "../tenantComponents/EditTenant";
import { TbPlayerSkipBack, TbPlayerSkipForward } from "react-icons/tb";
import { RiArrowLeftWideLine, RiArrowRightWideLine } from "react-icons/ri";

export default function TenantPage({ facilityId }) {
  const [facility, setFacility] = useState(facilityId);
  const [units, setUnits] = useState([]);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tenantIdToDelete, setTenantIdToDelete] = useState([]);
  const containerRef = useRef(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const newCount = tenants.filter((tenants) => tenants.status === "New").length;
  const activeCount = tenants.filter(
    (tenants) => tenants.status === "Active"
  ).length;
  const disabledCount = tenants.filter(
    (tenants) => tenants.status === "Disabled"
  ).length;

  const totalOutstandingBalance = units.reduce(
    (total, unit) => total + unit.paymentInfo?.balance,
    0
  );

  const refreshUnitTable = async (facilityId) => {
    axios.get(`/facilities/units/${facilityId}`).then(({ data }) => {
      setUnits(data.units);
    });
  };

  const promptDeleteTenant = (id) => {
    setTenantIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const deleteTenant = async (id) => {
    try {
      const response = await axios.delete(`/tenants/delete?tenantId=${id}`);
      toast.success(response.data.message);
      setTenants(tenants.filter((tenant) => tenant._id !== id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      toast.error(error.response.data.error);
      setIsDeleteModalOpen(false);
    }
  };

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

  useEffect(() => {
    setFacility(facilityId);
    refreshTenantTable(facilityId);
    refreshUnitTable(facilityId);
  }, [facilityId]);

  const refreshTenantTable = async (facilityId) => {
    axios
      .get(`/tenants`, {
        params: {
          facilityId: facilityId,
        },
      })
      .then(({ data }) => {
        setTenants(data);
      })
      .catch((error) => {
        console.error("Error fetching tenants:", error);
      });
  };

  const handleCreateSubmit = (e) => {
    console.log(e);
    toast.success("Tenant " + e.data.firstName + e.data.lastName + " Created");
    setCreateOpen(false);
    refreshTenantTable(facilityId);
    refreshUnitTable(facilityId);
    setOpenDropdown(null);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setOpenDropdown(null);
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };

  // Submit edit
  const handleEditSubmit = (e) => {
    toast.success("Tenant updated!");
    setEditOpen(false);
    const updatedTenants = tenants.map((tenant) => {
      if (tenant._id === e.data._id) {
        return { ...tenant, ...e.data };
      }
      return tenant;
    });
    setTenants(updatedTenants);
    setOpenDropdown(null);
  };

  // Calculate the indices of the tenants to display on the current page
  const indexOfLastTenant = currentPage * itemsPerPage;
  const indexOfFirstTenant = indexOfLastTenant - itemsPerPage;
  const currentTenants = tenants.slice(indexOfFirstTenant, indexOfLastTenant);

  // Function to handle page changes
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(tenants.length / itemsPerPage);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mx-2">
      {isCreateOpen && (
        <CreateTenantTenantPage
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
          facilityId={facilityId}
        />
      )}
      <div className="w-full p-5 bg-background-100 flex justify-around items-center mb-2 text-text-950 rounded-lg">
        <p className="text-sm">New: {newCount}</p>
        <p className="text-sm">Active: {activeCount}</p>
        <p className="text-sm">Disabled: {disabledCount}</p>
        <p className="text-sm">Total: {tenants.length}</p>
        <p className="text-sm">
          Total Outstanding Balance: ${totalOutstandingBalance}
        </p>
      </div>
      <div className="flex justify-end">
        <button
          className="block w-38 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 mr-10"
          onClick={() => setCreateOpen(true)}
        >
          Create Tenant
        </button>
      </div>
      <div className="container mx-auto px-4 mb-5">
        <table className="min-w-full table-auto bg-background-100">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                # of Units
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Access Code
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Email Address
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Outstanding Balance
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
            {currentTenants.map((tenant) => (
              <tr
                key={tenant._id}
                className="border-b bg-white rounded text-text-950"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.firstName} {tenant.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.units.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.accessCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.contactInfo?.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.contactInfo?.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  $
                  {tenant.units.reduce((total, unit) => {
                    return total + (unit.paymentInfo?.balance || 0);
                  }, 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tenant.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div>
                    <button
                      type="button"
                      className="inline-flex justify-center w-48 rounded-md shadow-sm px-4 py-2 bg-primary-500 text-sm font-medium text-white hover:bg-secondary-500"
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === tenant._id ? null : tenant._id
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
                  {openDropdown === tenant._id && (
                    <div
                      className="absolute w-32 mt-1 ml-32 rounded-md shadow-md bg-background-100 text-left"
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
                          onClick={() => setEditOpen(tenant._id)}
                        >
                          Edit
                        </a>
                        {isEditOpen && (
                          <EditTenant
                            facilityId={facilityId}
                            tenantId={tenant._id}
                            onClose={handleCloseEdit}
                            onSubmit={handleEditSubmit}
                          />
                        )}
                        {/* <a
                          className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                          role="menuitem"
                          tabIndex="-1"
                          onClick={() => promptDeleteTenant(tenant._id)}
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
                                Are you sure you want to delete tenant{" "}
                                {tenant.firstName} {tenant.lastName}?
                              </p>
                              <div className="flex justify-end mt-4">
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                                  onClick={() =>
                                    deleteTenant(tenantIdToDelete) &
                                    setOpenDropdown(null)
                                  }
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
                        )} */}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              className="mx-1 p-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              <TbPlayerSkipBack />
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="mx-1 px-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              <RiArrowLeftWideLine />
            </button>
            <p className="mx-3">
              Page {currentPage} of {totalPages}
            </p>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="mx-1 p-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              <RiArrowRightWideLine />
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
              className="mx-1 p-3 py-1 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              <TbPlayerSkipForward />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
