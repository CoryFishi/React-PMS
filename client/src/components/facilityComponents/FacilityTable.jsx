import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import EditFacility from "../facilityComponents/EditFacility";
import CreateFacility from "./CreateFacility";
import { TbPlayerSkipBack, TbPlayerSkipForward } from "react-icons/tb";
import { RiArrowLeftWideLine, RiArrowRightWideLine } from "react-icons/ri";

export default function FacilityTable() {
  // Facilities
  const [facilities, setFacilities] = useState([]);
  // Facility's Units
  const [units, setUnits] = useState(0);
  // Open/close dropdown
  const [openDropdown, setOpenDropdown] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // Ref so actions menu closes on outside click
  const containerRef = useRef(null);
  // Edit Facility popup
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facilityIdToDelete, setFacilityIdToDelete] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const promptDeleteFacility = (id) => {
    setFacilityIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Submit edit
  const handleEditSubmit = (e) => {
    toast.success("Facility updated!");
    setEditOpen(false);
    const updatedFacilities = facilities.map((facility) => {
      if (facility._id === e.data._id) {
        return { ...facility, ...e.data };
      }
      return facility;
    });
    setFacilities(updatedFacilities);
    setOpenDropdown(null);
  };

  // Update users table on change
  useEffect(() => {
    axios.get("/facilities&company").then(({ data }) => {
      setFacilities(data.facilities);
      // Calculate total units after Axios call is completed
      const totalUnits = Object.values(data.facilities).reduce(
        (total, json) => {
          // Add the length of units array from the current JSON to the total
          return total + (json.units.length || 0); // Ensure units property exists and is an array
        },
        0
      );

      // Set the total units
      setUnits(totalUnits);
    });
  }, []);

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

  // Delete selected user
  const deleteFacility = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/delete?facilityId=${id}`
      );
      toast.success(response.data.message);
      setFacilities(facilities.filter((facility) => facility._id !== id));
      setIsDeleteModalOpen(false); // Close the modal
      setOpenDropdown(null);
    } catch (error) {
      console.error("Failed to delete facility:", error);
      toast.error(error.response.data.error);
      setIsDeleteModalOpen(false); // Close the modal on error as well
    }
  };

  // Open/close actions drop down
  const toggleDropdown = (facilityId) => {
    setOpenDropdown(openDropdown === facilityId ? null : facilityId);
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

  // Submit create=
  const handleCreateSubmit = (e) => {
    toast.success("Facility created!");
    setCreateOpen(false);
    const updatedFacilities = [...facilities, e.data];
    setFacilities(updatedFacilities);
    setOpenDropdown(null);
  };

  const deploy = async (facilityId) => {
    try {
      setOpenDropdown(null);
      const response = await axios.put(
        `/facilities/update/status`,
        {
          status: "Enabled",
        },
        {
          params: {
            facilityId: facilityId,
          },
        }
      );
      const updatedFacility = response.data;

      const updatedFacilities = facilities.map((facility) => {
        if (facility._id === updatedFacility._id) {
          return { ...facility, ...updatedFacility };
        }
        return facility;
      });

      setFacilities(updatedFacilities);
    } catch (error) {
      console.error("Failed to update facility:", error);
      toast.error(error.response.data.error);
    }
  };

  // Calculate the indices of the users to display on the current page
  const indexOfLastFacility = currentPage * itemsPerPage;
  const indexOfFirstFacility = indexOfLastFacility - itemsPerPage;
  const currentFacilities = facilities.slice(
    indexOfFirstFacility,
    indexOfLastFacility
  );

  // Function to handle page changes
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(facilities.length / itemsPerPage);

  return (
    <div className="h-full w-full overflow-y-hidden relative">
      <div className="w-full p-5 bg-background-100 flex justify-around items-center mb-2 text-text-950">
        <h2 className="text-xl font-bold">Facility Statistics</h2>
        <p className="text-sm">
          Pending Deployment:{" "}
          {
            facilities.filter(
              (facility) => facility.status === "Pending Deployment"
            ).length
          }
        </p>
        <p className="text-sm">
          Enabled:{" "}
          {
            facilities.filter((facility) => facility.status === "Enabled")
              .length
          }
        </p>
        <p className="text-sm">
          Maintenance:{" "}
          {
            facilities.filter((facility) => facility.status === "Maintenance")
              .length
          }
        </p>
        <p className="text-sm">Total Units: {units}</p>
        <p className="text-sm">Total Facilities: {facilities.length}</p>
      </div>
      <div className="flex justify-end">
        <button
          className="block w-40 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 mr-10"
          onClick={() => setCreateOpen(true)}
        >
          Create Facility
        </button>
      </div>

      {isCreateOpen && (
        <CreateFacility
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
        />
      )}
      <div className="container mx-auto w-full px-4 mt-2 mb-5 h-full">
        <table className="w-full table-auto bg-background-100">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Manager
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Units
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
            {currentFacilities.map((facility) => (
              <tr
                key={facility._id}
                className="border-b bg-white rounded text-text-950"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {facility.facilityName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {facility.company.companyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {facility.address.street1}
                  {facility.address.street2
                    ? `, ${facility.address.street2}`
                    : ""}
                  , {facility.address.city}, {facility.address.state}{" "}
                  {facility.address.zipCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {facility?.manager?.name ?? "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {facility.units.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {facility.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className="relative inline-block text-left">
                    <div>
                      <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-primary-500 text-sm font-medium text-white hover:bg-secondary-500"
                        onClick={() => toggleDropdown(facility._id)}
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
                    {openDropdown === facility._id && (
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
                            onClick={() => setEditOpen(true)}
                          >
                            Edit
                          </a>
                          {isEditOpen && (
                            <EditFacility
                              facilityId={facility._id}
                              onClose={handleCloseEdit}
                              onSubmit={handleEditSubmit}
                            />
                          )}
                          {facility.status === "Pending Deployment" && (
                            <a
                              className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                              role="menuitem"
                              tabIndex="-1"
                              onClick={() => deploy(facility._id)}
                            >
                              Deploy
                            </a>
                          )}
                          <a
                            className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                            role="menuitem"
                            tabIndex="-1"
                            onClick={() => promptDeleteFacility(facility._id)}
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
                                  Are you sure you want to delete this facility?
                                </p>
                                <div className="flex justify-end mt-4">
                                  <button
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                                    onClick={() =>
                                      deleteFacility(facilityIdToDelete)
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
        {totalPages > 1 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center mt-4">
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              className="mx-1 p-3 py-2 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              <TbPlayerSkipBack />
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="mx-1 px-3 py-2 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              <RiArrowLeftWideLine />
            </button>
            <p className="mx-3">
              Page {currentPage} of {totalPages}
            </p>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="mx-1 p-3 py-2 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              <RiArrowRightWideLine />
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
              className="mx-1 p-3 py-2 rounded bg-primary-500 text-white disabled:opacity-50"
            >
              <TbPlayerSkipForward />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
