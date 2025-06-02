import axios from "axios";
import { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../../../context/userContext";
import ModalContainer from "../sharedComponents/ModalContainer";
import { IoIosCreate } from "react-icons/io";
import InputBox from "../sharedComponents/InputBox";
import SelectOption from "../sharedComponents/SelectOption";
import MultiSelectDropdown from "../sharedComponents/MultiSelectDropdown";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function CreateUser({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [address, setAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState([]);
  const [userFacilities, setUserFacilities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Enabled");
  const { user } = useContext(UserContext);
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
  };

  const handleFacilityChange = (facilityId) => {
    setUserFacilities((prevSelectedFacilities) =>
      prevSelectedFacilities.includes(facilityId)
        ? prevSelectedFacilities.filter((id) => id !== facilityId)
        : [...prevSelectedFacilities, facilityId]
    );
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
  }, []);

  const handleSubmit = async () => {
    if (company === "") {
      setCompany(null);
    }
    try {
      const response = await axios.post(
        `/users/register`,
        {
          name: name,
          email: email,
          phone: phone,
          displayName: displayName,
          role: role,
          company: company,
          facilities: userFacilities,
          status: status,
          address: address,
          createdBy: user._id,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      onSubmit(response);
    } catch (error) {
      console.error("Failed to create user:", error.response.data.error);
      toast.error(error.response.data.error);
    }
  };

  return (
    <ModalContainer
      title={"Creating User"}
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
            value={displayName}
            onchange={(e) => setDisplayName(e.target.value)}
            placeholder={"Display Name"}
            required={true}
          />
          <InputBox
            value={name}
            onchange={(e) => setName(e.target.value)}
            placeholder={"Name"}
            required={true}
          />
          <InputBox
            value={email}
            onchange={(e) => setEmail(e.target.value)}
            placeholder={"Email Address"}
            required={true}
          />
          <InputBox
            value={phone}
            onchange={(e) => setPhone(e.target.value)}
            placeholder={"Phone Number"}
          />
          <div className="flex gap-3">
            <div className="flex flex-col gap-3">
              <InputBox
                value={address.street1}
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
                value={address.country}
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
                value={address.city}
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
                value={address.street2}
                onchange={(e) =>
                  setAddress((prevAddress) => ({
                    ...prevAddress,
                    street2: e.target.value,
                  }))
                }
                placeholder={"Street Address 2"}
              />

              <InputBox
                value={address.state}
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
                value={address.zipCode}
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
            value={role}
            onChange={handleChange}
            options={Array.isArray(roleOptions) ? roleOptions : []}
            placeholder="Role"
          />
          <div>
            {(role === "Company_User" || role === "Company_Admin") && (
              <SelectOption
                required={true}
                value={company}
                onChange={handleCompanyChange}
                options={Array.isArray(companies) ? companies : []}
                placeholder="Company"
              />
            )}
            {role === "Company_User" && company && (
              <MultiSelectDropdown
                label="Facilities"
                options={facilities}
                selected={userFacilities}
                onChange={setUserFacilities}
                required
              />
            )}
          </div>
          <div className="flex items-center ml-5">
            <label
              htmlFor="status"
              className="flex items-center cursor-pointer gap-2"
            >
              <input
                type="checkbox"
                id="status"
                checked={status === "Enabled"}
                onChange={toggleStatus}
                className="hover:cursor-pointer"
              />
              <span>{status}</span>
            </label>
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
