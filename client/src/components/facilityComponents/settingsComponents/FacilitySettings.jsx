import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import CreateAmenity from "./amenityComponents/CreateAmenity";
import EditAmenity from "./amenityComponents/EditAmenity";
import InputBox from "../../sharedComponents/InputBox";
import PaginationFooter from "../../sharedComponents/PaginationFooter";
import DataTable from "../../sharedComponents/DataTable";
import ModalContainer from "../../sharedComponents/ModalContainer";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function FacilitySettings() {
  const [amenities, setAmenities] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAmenities, setFilteredAmenities] = useState([]);
  const [paginationLevels, setPaginationLevels] = useState([
    5, 10, 25, 50, 100, 250,
  ]);
  const [selectedAmenity, setSelectedAmenity] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  //  Sorting states
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState("Name");

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
      setFilteredAmenities([...amenities]);
      return;
    }

    const sorted = [...filteredAmenities].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredAmenities(sorted);
  };

  const deleteAmenity = async (id) => {
    try {
      const response = await axios.delete(
        `/facilities/${facilityId}/settings/amenities?amenityId=${id}`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      toast.success(response.data.message);
      setAmenities(amenities.filter((amenity) => amenity._id !== id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete unit type:", error);
      toast.error(error.response.data.message);
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

  const submitAmenity = (e) => {
    setAmenities(e.data);
    setIsCreateOpen(false);
    toast.success("Unit Type Created!");
  };

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setAmenities(data.settings.amenities);
      });
  }, []);

  useEffect(() => {
    const filteredUnitTypes = amenities.filter((amenity) =>
      amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAmenities(filteredUnitTypes);
  }, [amenities, searchQuery]);

  const [facilityName, setFacilityName] = useState("");
  const [address, setAddress] = useState({
    street1: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);
  const [status, setStatus] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("General");
  const { facilityId } = useParams();

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setFacilityName(data.facilityName);
        setStatus(data.status);
        setAddress(data.address);
        setEmail(data.contactInfo.email);
        setPhone(data.contactInfo.phone);
        setManager(data.manager);
        setCompany(data.company);
      });
  }, [facilityId]);

  useEffect(() => {
    if (company) {
      axios
        .get(`/users/company/${company}`, {
          headers: {
            "x-api-key": API_KEY,
          },
        })
        .then(({ data }) => {
          setManagers(data);
        });
    }
  }, [company]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prevAddress) => ({
      ...prevAddress,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const response = await axios.put(
        `/facilities/update`,
        {
          facilityName,
          contactInfo: {
            phone,
            email,
          },
          status: status,
          address: address,
          manager: manager,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
          params: {
            facilityId: facilityId,
          },
        }
      );
      toast.success(`${response.data?.facilityName} successfully saved!`);
      setIsSaving(false);
    } catch (error) {
      console.error("Failed to update facility:", error);
      toast.error(error.response.data.error);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Amenity Name",
      accessor: (u) => u.name || "-",
    },
    {
      key: "priority",
      label: "Priority",
      accessor: (u) => (u.priority ? "True" : "False" || "-"),
    },
    {
      key: "",
      label: "",
      sortable: false,
      render: (a, index) => (
        <div key={index} className="items-center flex justify-center gap-1">
          <a
            className="text-sm hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-600 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            role="menuitem"
            tabIndex="-1"
            onClick={() => {
              setSelectedAmenity(a);
              setIsEditModalOpen(true);
              setOpenDropdown(false);
            }}
          >
            Edit
          </a>
          <a
            className="text-sm hover:bg-slate-200 dark:hover:bg-slate-900 dark:border-slate-600 border rounded-lg px-1 flex items-center cursor-pointer select-none"
            role="menuitem"
            tabIndex="-1"
            onClick={() => {
              setSelectedAmenity(a._id);
              setIsDeleteModalOpen(true);
              setOpenDropdown(false);
            }}
          >
            Delete
          </a>
        </div>
      ),
    },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSelectedAmenity((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAmenitySubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedAmenity = {
        name: selectedAmenity.name,
        priority: selectedAmenity.priority,
      };
      const response = await axios.put(
        `/facilities/${facilityId}/settings/amenities?amenityId=${selectedAmenity._id}`,
        updatedAmenity,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      setAmenities((prev) =>
        prev.map((amenity) =>
          amenity._id === response.data?.updatedAmenity?._id
            ? response.data.updatedAmenity
            : amenity
        )
      );
      toast.success("Amenity updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating amenity:", error);
      toast.error("Failed to update amenity.");
    }
  };

  return (
    <div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-slate-700 mt-3">
        <h1 className="text-xl font-bold dark:text-white">
          Facility Information Settings
        </h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "General"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-sky-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("General")}
          >
            General
          </button>
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "Amenities"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-sky-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Amenities")}
          >
            Amenities
          </button>
        </div>
      </div>
      {activeTab === "General" ? (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-3 flex flex-col gap-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <div className="flex flex-col gap-1">
              <label className="font-medium">Facility Name</label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="appearance-none w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="manager" className="font-medium">
                Manager
              </label>
              <select
                name="manager"
                id="manager"
                value={manager ?? ""}
                onChange={(e) => setManager(e.target.value)}
                className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value="">None</option>
                {managers.map((manager) => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="font-medium">Address</label>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  className="block text-xs font-medium text-slate-500 dark:text-slate-200"
                  htmlFor="street1"
                >
                  Street 1
                </label>
                <input
                  type="text"
                  name="street1"
                  id="street1"
                  value={address.street1}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="block text-xs font-medium text-slate-500 dark:text-slate-200"
                  htmlFor="street2"
                >
                  Street 2
                </label>
                <input
                  type="text"
                  name="street2"
                  id="street2"
                  value={address.street2 ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-200">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={address.city ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-200">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={address.state ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-200">
                  Zip Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={address.zipCode ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-200">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={address.country ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="status" className="font-medium">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={status ?? ""}
                onChange={(e) => setStatus(e.target.value)}
                className="block w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value="">Select a status</option>
                {status === "Pending Deployment" && (
                  <option value="Pending Deployment">Pending Deployment</option>
                )}
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="font-medium">Contact Information</label>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  value={email ?? ""}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-200">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone ?? ""}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="text-right w-full justify-end flex">
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 flex items-center justify-center gap-2"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-sky-300"></div>
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div>
          {isCreateOpen && (
            <CreateAmenity
              setIsCreateOpen={setIsCreateOpen}
              onSubmit={submitAmenity}
              facilityId={facilityId}
            />
          )}
          {isEditModalOpen && selectedAmenity && (
            <EditAmenity
              selectedAmenity={selectedAmenity}
              handleChange={handleChange}
              handleAmenitySubmit={handleAmenitySubmit}
              setIsEditModalOpen={setIsEditModalOpen}
            />
          )}

          {isDeleteModalOpen && (
            <ModalContainer
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              title="Confirm Delete"
              mainContent={
                <p className="pt-3">
                  Are you sure you want to delete this amenity?
                </p>
              }
              responseContent={
                <div className="flex justify-end gap-2">
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2 hover:scale-105 transition-all cursor-pointer duration-300"
                    onClick={() => deleteAmenity(selectedAmenity)}
                  >
                    Delete
                  </button>
                  <button
                    className="bg-slate-300 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded hover:scale-105 transition-all cursor-pointer duration-300"
                    onClick={() =>
                      setIsDeleteModalOpen(false) & setOpenDropdown(null)
                    }
                  >
                    Cancel
                  </button>
                </div>
              }
            />
          )}

          <div className="py-4 flex items-center justify-end text-center px-2">
            <InputBox
              placeholder="Search amenities..."
              value={searchQuery}
              onchange={(e) =>
                setSearchQuery(e.target.value) & setCurrentPage(1)
              }
            />
            <button
              className="bg-sky-500 text-white px-3 py-3 rounded hover:bg-sky-600 ml-3 min-w-fit font-bold hover:scale-105 transition-all cursor-pointer duration-300"
              onClick={() => setIsCreateOpen(true)}
            >
              Create Amenity
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-2">
            <DataTable
              columns={columns}
              data={filteredAmenities}
              currentPage={currentPage}
              rowsPerPage={itemsPerPage}
              sortDirection={sortDirection}
              sortedColumn={sortedColumn}
              onSort={handleColumnSort}
            />
            {filteredAmenities.length === 0 && (
              <div className="py-5 w-full flex justify-center">
                <p className="text-sm text-slate-500">No Amenities Found</p>
              </div>
            )}
            <div className="py-3 w-full justify-between items-center">
              <PaginationFooter
                rowsPerPage={itemsPerPage}
                setRowsPerPage={setItemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                items={filteredAmenities}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
