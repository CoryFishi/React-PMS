import axios from "axios";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import ModalContainer from "../sharedComponents/ModalContainer";
const API_KEY = import.meta.env.VITE_API_KEY;
import { IoIosCreate } from "react-icons/io";
import InputBox from "../sharedComponents/InputBox";
import MultiSelectDropdown from "../sharedComponents/MultiSelectDropdown";
import SelectOption from "../sharedComponents/SelectOption";

export default function EditUser({ userId, onClose, onSubmit }) {
  const [userData, setUserData] = useState({});
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [address, setAddress] = useState({
    street1: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [phone, setPhone] = useState("");
  const [oldAddress, setOldAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isConfirmed, setIsConfirmed] = useState("");
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState([]);
  const [userFacilities, setUserFacilities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [status, setStatus] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [roleOptions, setRoleOptions] = useState([
    { id: "Company_User", name: "Company User" },
    { id: "Company_Admin", name: "Company Admin" },
    { id: "System_Admin", name: "System Admin" },
    { id: "System_User", name: "System User" },
  ]);
  const handleChange = (e) => {
    if (e.target.value === "System_Admin" || e.target.value === "System_User") {
      setCompany(null);
      setUserFacilities([]);
    } else {
      setCompany("");
    }
    setRole(e.target.value);
  };
  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value;
    setCompany(selectedCompany);
    setUserFacilities([]);
    if (e !== "") {
      axios
        .get(`/companies/${selectedCompany}/facilities`, {
          headers: {
            "x-api-key": API_KEY,
          },
        })
        .then(({ data }) => {
          setFacilities(
            data.map((f) => ({
              id: f._id,
              name: f.facilityName,
            }))
          );
        });
    }
  };

  const toggleStatus = () => {
    setStatus((prevState) =>
      prevState === "Enabled" ? "Disabled" : "Enabled"
    );
  };

  useEffect(() => {
    axios
      .get("/companies", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setCompanies(
          data.map((c) => ({
            id: c._id,
            name: c.companyName,
          }))
        );
      });
    axios
      .get(`/users/${userId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setUserData(data || "");
        setName(data.name || "");
        setDisplayName(data.displayName || "");
        setRole(data.role || "");
        setCompany(data.company || "");
        setUserFacilities(data.facilities || "");
        setIsConfirmed(data.confirmed || false);
        setStatus(data.status || "");
        setAddress(data.address || "");
        setOldAddress(data.address || "");
        setPhone(data.phone || "");
      });
  }, [userId]);
  useEffect(() => {
    if (company && (role === "Company_User" || role === "Company_Admin")) {
      axios
        .get(`/companies/${company}/facilities`, {
          headers: {
            "x-api-key": API_KEY,
          },
        })
        .then(({ data }) => {
          setFacilities(
            data.map((f) => ({
              id: f._id,
              name: f.facilityName,
            }))
          );
        });
    }
  }, [company, role]);

  useEffect(() => {
    axios
      .get("/companies", {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setCompanies(
          data.map((c) => ({
            id: c._id,
            name: c.companyName,
          }))
        );
      });
  }, []);

  const updateAddressWithOldValues = (address, oldAddress) => {
    return Object.keys(address).reduce((updatedAddress, key) => {
      updatedAddress[key] =
        address[key] === "" ? oldAddress[key] : address[key];
      return updatedAddress;
    }, {});
  };

  const handleSubmit = async () => {
    try {
      var submittedName = name.trim() === "" ? name : name;
      if (submittedName === "") {
        submittedName = userData?.name;
      }
      var submittedDisplayName =
        displayName.trim() === "" ? displayName : displayName;
      if (submittedDisplayName === "") {
        submittedDisplayName = userData?.displayName;
      }
      const submittedRole = role.trim() === "" ? role : role;
      setAddress(updateAddressWithOldValues(address, oldAddress));
      const response = await axios.put(
        `/users/update`,
        {
          userId: userId,
          name: submittedName,
          displayName: submittedDisplayName,
          confirmed: isConfirmed,
          role: submittedRole,
          company: company,
          facilities: userFacilities,
          status: status,
          address: address,
          phone: phone,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      onSubmit(response);
    } catch (error) {
      console.log(error);
      console.error("Failed to update user:", error.response.data.error);
      toast.error(error.response.data.error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <ModalContainer
      title={`Editing ${userId}`}
      icon={<IoIosCreate />}
      mainContent={
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-1">
          {(role === "System_User" || role === "System_Admin") && (
            <div className="text-red-500">
              <h2 className="font-bold text-lg">Warning!</h2>
              <p className="text-wrap">
                This user will have full control and visibility over every
                company!
              </p>
            </div>
          )}
          <InputBox
            value={displayName ?? ""}
            onchange={(e) => setDisplayName(e.target.value)}
            placeholder={"Display Name"}
            required={true}
          />
          <InputBox
            value={name ?? ""}
            onchange={(e) => setName(e.target.value)}
            placeholder={"Name"}
            required={true}
          />
          <InputBox
            value={userData.email ?? ""}
            placeholder="Email Address"
            required={true}
          />
          <InputBox
            value={phone ?? ""}
            onchange={(e) => setPhone(e.target.value)}
            placeholder={"Phone Number"}
          />

          <div className="flex gap-3">
            <div className="flex flex-col gap-3">
              <InputBox
                value={address.street1 ?? ""}
                onchange={(e) =>
                  setAddress((prevAddress) => ({
                    ...prevAddress,
                    street1: e.target.value,
                  }))
                }
                placeholder={"Street Address 1"}
                required={true}
              />
              <InputBox
                value={address.country ?? ""}
                onchange={(e) =>
                  setAddress((prevAddress) => ({
                    ...prevAddress,
                    country: e.target.value,
                  }))
                }
                placeholder={"Country"}
                required={true}
              />
              <InputBox
                value={address.city ?? ""}
                onchange={(e) =>
                  setAddress((prevAddress) => ({
                    ...prevAddress,
                    city: e.target.value,
                  }))
                }
                placeholder={"City"}
                required={true}
              />
            </div>
            <div className="flex flex-col gap-3">
              <InputBox
                value={address.street2 ?? ""}
                onchange={(e) =>
                  setAddress((prevAddress) => ({
                    ...prevAddress,
                    street2: e.target.value,
                  }))
                }
                placeholder={"Street Address 2"}
              />

              <InputBox
                value={address.state ?? ""}
                onchange={(e) =>
                  setAddress((prevAddress) => ({
                    ...prevAddress,
                    state: e.target.value,
                  }))
                }
                placeholder={"State"}
                required={true}
              />
              <InputBox
                value={address.zipCode ?? ""}
                onchange={(e) =>
                  setAddress((prevAddress) => ({
                    ...prevAddress,
                    zipCode: e.target.value,
                  }))
                }
                placeholder={"Zip Code"}
                required={true}
              />
            </div>
          </div>
          <SelectOption
            required={true}
            value={role ?? ""}
            onChange={handleChange}
            options={Array.isArray(roleOptions) ? roleOptions : []}
            placeholder="Role"
          />
          <div>
            {(role === "Company_User" || role === "Company_Admin") && (
              <SelectOption
                required={true}
                value={company ?? ""}
                onChange={handleCompanyChange}
                options={Array.isArray(companies) ? companies : []}
                placeholder="Company"
              />
            )}
            {role === "Company_User" && company && (
              <MultiSelectDropdown
                label="Facilities"
                options={facilities}
                selected={userFacilities ?? ""}
                onChange={setUserFacilities}
                required
              />
            )}
          </div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="status"
              className="flex items-center ml-3 hover:cursor-pointer gap-2"
            >
              <input
                type="checkbox"
                id="status"
                checked={status === "Enabled"}
                onChange={toggleStatus}
              />
              <span>{status}</span>
            </label>
            <div className="flex items-center gap-2 mr-3">
              <input
                type="checkbox"
                id="confirmed"
                checked={isConfirmed}
                disabled
              />
              <span>Email Confirmed</span>
            </div>
          </div>
        </div>
      }
      responseContent={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-blue-700 focus:outline-none focus:border-blue-700 focus:ring focus:ring-blue-200 transition ease-in duration-200"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-zinc-700 focus:outline-none focus:border-zinc-700 focus:ring focus:ring-zinc-200 transition ease-in duration-200"
          >
            Close
          </button>
        </div>
      }
    />
  );
}
