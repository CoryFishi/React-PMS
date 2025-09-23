import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function GeneralSettings() {
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
  const [activeTab, setActiveTab] = useState("Facility");
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

  return (
    <div>
      <div className="border-b flex items-center justify-between mx-5 dark:border-slate-700 mt-3">
        <h1 className="text-xl font-bold dark:text-white">
          Facility Information Settings
        </h1>
        <div className="flex mr-5 space-x-1">
          <button
            className={`text-sm px-5 py-3 focus:outline-none dark:border-slate-700 relative top-[1px] shadow-none  ${
              activeTab === "Facility"
                ? "border border-slate-300 rounded-t-md bg-white dark:bg-slate-800 dark:text-white border-b-0 cursor-default"
                : "text-sky-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-t"
            }`}
            onClick={() => setActiveTab("Facility")}
          >
            Facility
          </button>
        </div>
      </div>
      {activeTab === "Facility" ? (
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
                className="appearance-none w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  className="block text-xs font-medium text-zinc-500 dark:text-zinc-200"
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
                  className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="block text-xs font-medium text-zinc-500 dark:text-zinc-200"
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
                  className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-200">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={address.city ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-200">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={address.state ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-200">
                  Zip Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={address.zipCode ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-200">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={address.country ?? ""}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="block w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-200">
                  Email
                </label>
                <input
                  type="email"
                  value={email ?? ""}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-200">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone ?? ""}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border dark:bg-zinc-800 dark:border-zinc-700 border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="text-right w-full justify-end flex">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-300"></div>
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
        <div className="items-center justify-center flex-col flex m-10">
          <p className="text-red-500">UNDER DEVELOPMENT</p>
        </div>
      )}
    </div>
  );
}
