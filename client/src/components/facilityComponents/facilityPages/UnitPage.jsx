import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import CreateUnit from "../unitComponents/CreateUnit";
import EditUnit from "../unitComponents/EditUnit";
import CreateTenantUnitPage from "../tenantComponents/CreateTenantUnitPage";

export default function UnitPage({ facilityId }) {
  const [facility, setFacility] = useState(facilityId);
  const [units, setUnits] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isRentModalMainOpen, setIsRentModalMainOpen] = useState(false);
  const [isMoveOutModalOpen, setIsMoveOutModalOpen] = useState(false);
  const [unitIdToDelete, setUnitIdToDelete] = useState(null);
  const [unitIdToMoveOut, setUnitIdToMoveOut] = useState(null);
  const [tenancy, setTenancy] = useState(false);
  const containerRef = useRef(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const promptDeleteUnit = (id) => {
    setUnitIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const promptMoveOut = async (unitId) => {
    setUnitIdToMoveOut(unitId);
    setIsMoveOutModalOpen(true);
  };

  const rentedCount = units.filter(
    (units) => units.availability === false
  ).length;

  const vacantCount = units.filter(
    (units) => units.availability === true
  ).length;

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
    refreshUnitTable(facilityId);
  }, [facilityId]);

  // Submit create=
  const handleCreateSubmit = (e) => {
    toast.success("Unit " + e.data[0].unitNumber + " Created");
    setCreateOpen(false);
    const updatedUnits = [...units, e.data[0]];
    setUnits(updatedUnits);
    setOpenDropdown(null);
  };

  const handleCloseCreate = () => {
    setCreateOpen(false);
    setOpenDropdown(null);
  };

  const handleTenantSubmit = (e) => {
    toast.success(
      e.unitNumber +
        " Rented to " +
        e.tenant.firstName +
        " " +
        e.tenant.lastName
    );
    setIsRentModalMainOpen(false);
    refreshUnitTable(facilityId);
    setOpenDropdown(null);
  };

  const handleCloseTenant = () => {
    setIsRentModalMainOpen(false);
    setOpenDropdown(null);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setOpenDropdown(null);
  };
  const handleEditSubmit = (e) => {
    toast.success("Unit updated!");
    setEditOpen(false);
    const updatedUnits = units.map((unit) => {
      if (unit._id === e.data.unit._id) {
        return { ...unit, ...e.data.unit };
      }
      return unit;
    });
    setUnits(updatedUnits);
    setOpenDropdown(null);
  };

  const deleteUnit = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/units/delete?unitId=${id}`
      );
      toast.success(response.data.message);
      setUnits(units.filter((unit) => unit._id !== id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete unit:", error);
      toast.error(error.response.data.message);
      setIsDeleteModalOpen(false);
    }
  };

  const moveOutUnit = async (id) => {
    try {
      const response = await axios.put(
        `/facilities/units/${facilityId}/${id}/moveout`
      );
      toast.success("Tenant has been moved out!");
      const updatedUnits = units.map((unit) => {
        if (unit._id === response.data._id) {
          return { ...unit, ...response.data };
        }
        return unit;
      });
      setUnits(updatedUnits);
      setIsMoveOutModalOpen(false); // Close the modal
      setOpenDropdown(null);
    } catch (error) {
      console.error("Failed to delete unit:", error);
      toast.error(error.response.data.message);
      setIsMoveOutModalOpen(false); // Close the modal
    }
  };

  const refreshUnitTable = async (facilityId) => {
    axios.get(`/facilities/units/${facility}`).then(({ data }) => {
      setUnits(data.units);
    });
  };

  // Calculate the indices of the units to display on the current page
  const indexOfLastUnit = currentPage * itemsPerPage;
  const indexOfFirstUnit = indexOfLastUnit - itemsPerPage;
  const currentUnits = units.slice(indexOfFirstUnit, indexOfLastUnit);

  // Function to handle page changes
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total number of pages
  const totalPages = Math.ceil(units.length / itemsPerPage);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mx-2">
      {isCreateOpen && (
        <CreateUnit
          onClose={handleCloseCreate}
          onSubmit={handleCreateSubmit}
          facilityId={facilityId}
        />
      )}

      <div className="w-full p-5 bg-background-100 flex justify-around items-center mb-2 text-text-950 rounded-lg">
        <p className="text-sm">Rented: {rentedCount}</p>
        <p className="text-sm">Vacant: {vacantCount}</p>
        <p className="text-sm">Total: {units.length}</p>
      </div>
      <div className="flex justify-end">
        <button
          className="block w-32 py-2 px-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-accent-400 mb-2 mr-10"
          onClick={() => setCreateOpen(true)}
        >
          Create Unit
        </button>
      </div>
      <div className="container mx-auto px-4 mb-5">
        <table className="min-w-full table-auto bg-background-100">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Unit Number
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Monthly
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Availability
              </th>
              <th className="px-6 py-3 text-xs font-medium text-text-950 uppercase tracking-wider">
                Tenant
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
            {currentUnits.map((unit) => (
              <tr
                key={unit._id}
                className="border-b bg-white rounded text-text-950"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {unit.unitNumber}
                  {unit.climateControlled ? " - ⌂" : ""}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div>
                    {unit.size?.width +
                      "x" +
                      unit.size?.depth +
                      " " +
                      unit.size?.unit || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {"$" + unit.pricePerMonth || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {unit.availability == true && `✔`}
                  {unit.availability == false && `✕`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {unit.tenant?.firstName
                    ? unit.tenant.firstName + " " + unit.tenant?.lastName
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {unit.tenant?.balance !== undefined
                    ? `$${unit.tenant.balance}`
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {unit.tenant?.status || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div>
                    <button
                      type="button"
                      className="inline-flex justify-center w-48 rounded-md shadow-sm px-4 py-2 bg-primary-500 text-sm font-medium text-white hover:bg-secondary-500"
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === unit._id ? null : unit._id
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
                  {openDropdown === unit._id && (
                    <div
                      className="origin-center absolute ml-12 w-32 mt-1 rounded-md shadow-md bg-background-100 text-left"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="menu-button"
                      tabIndex="-1"
                      ref={containerRef}
                    >
                      {isRentModalMainOpen && (
                        <CreateTenantUnitPage
                          onClose={handleCloseTenant}
                          onSubmit={handleTenantSubmit}
                          unitId={unit._id}
                          tenancy={tenancy}
                        />
                      )}
                      <div className="py-1" role="none">
                        <a
                          className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200 text-left"
                          role="menuitem"
                          tabIndex="-1"
                          onClick={() => setEditOpen(unit._id)}
                        >
                          Edit
                        </a>
                        {isEditOpen && (
                          <EditUnit
                            unitId={unit._id}
                            onClose={handleCloseEdit}
                            onSubmit={handleEditSubmit}
                          />
                        )}
                        {unit.availability === true && (
                          <a
                            className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                            role="menuitem"
                            tabIndex="-1"
                            onClick={() => setIsRentModalOpen(true)}
                          >
                            Rent
                          </a>
                        )}

                        {isRentModalOpen && (
                          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                            <div className="bg-background-100 p-4 rounded-lg shadow-lg">
                              <h3 className="text-lg font-bold">
                                Renting Unit {unit.unitNumber}
                              </h3>
                              <p>Are you sure you want to rent this unit?</p>
                              <div className="flex justify-end mt-4">
                                <button
                                  className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-primary-500 text-sm font-medium text-white hover:bg-secondary-500 mr-2"
                                  onClick={() =>
                                    setTenancy(false) &
                                    setIsRentModalMainOpen(true) &
                                    setIsRentModalOpen(false)
                                  }
                                >
                                  New Tenant
                                </button>
                                <button
                                  className="inline-flex justify-center w-full rounded-md shadow-sm px-4 py-2 bg-primary-500 text-sm font-medium text-white hover:bg-secondary-500 mr-2"
                                  onClick={() =>
                                    setTenancy(true) &
                                    setIsRentModalMainOpen(true) &
                                    setIsRentModalOpen(false)
                                  }
                                >
                                  Existing Tenant
                                </button>
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                                  onClick={() =>
                                    setIsRentModalOpen(false) &
                                    setOpenDropdown(null)
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {unit.availability === false && (
                          <a
                            className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                            role="menuitem"
                            tabIndex="-1"
                            onClick={() => promptMoveOut(unit._id)}
                          >
                            Move Out
                          </a>
                        )}
                        {isMoveOutModalOpen && (
                          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                            <div className="bg-background-100 p-4 rounded-lg shadow-lg">
                              <h3 className="text-lg font-bold">
                                Moving Out Unit {unit.unitNumber}
                              </h3>
                              <p>
                                Are you sure you want to move out{" "}
                                {unit.tenant?.firstName} {unit.tenant?.lastName}
                                ?
                              </p>
                              <div className="flex justify-center mt-4">
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                                  onClick={() => moveOutUnit(unitIdToMoveOut)}
                                >
                                  Move Out
                                </button>
                                <button
                                  className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded"
                                  onClick={() =>
                                    setIsMoveOutModalOpen(false) &
                                    setOpenDropdown(null)
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <a
                          className="text-text-950 block px-4 py-2 text-sm hover:bg-background-200"
                          role="menuitem"
                          tabIndex="-1"
                          onClick={() => promptDeleteUnit(unit._id)}
                        >
                          Delete
                        </a>
                        {isDeleteModalOpen && (
                          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                            <div className="bg-background-100 p-4 rounded-lg shadow-lg">
                              <h3 className="text-lg font-bold">
                                Confirm Delete
                              </h3>
                              <p>Are you sure you want to delete this unit?</p>
                              <div className="flex justify-end mt-4">
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
                                  onClick={() =>
                                    deleteUnit(unitIdToDelete) &
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
                        )}
                      </div>
                    </div>
                  )}
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
    </div>
  );
}
