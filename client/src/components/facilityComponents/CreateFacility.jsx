import axios from "axios";
import { useState, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { UserContext } from "../../../context/userContext";
import ModalContainer from "../sharedComponents/ModalContainer";
import InputBox from "../sharedComponents/InputBox";
const API_KEY = import.meta.env.VITE_API_KEY;
import SelectOption from "../sharedComponents/SelectOption";

export default function CreateFacility({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactInfo, setContactInfo] = useState([]);
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState([]);
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);
  const { user } = useContext(UserContext);

  const handleCompanyChange = (e) => {
    const selectedCompany = e.target.value;
    setCompany(selectedCompany);
    setManager(undefined);

    axios
      .get(`/users/company/${selectedCompany}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setManagers(
          data.map((m) => ({
            id: m._id,
            name: m.name,
          }))
        );
      });
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
    try {
      const selectedCompany = company === "" ? null : company;
      const response = await axios.post(
        `/facilities/create`,
        {
          facilityName: name,
          contactInfo: contactInfo,
          address: address,
          company: selectedCompany,
          manager: manager,
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
      console.error("Failed to create company:", error);
      toast.error(error.response.data.error);
    }
  };

  return (
    <ModalContainer
      title={"Creating Facility"}
      mainContent={
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-1">
          <InputBox
            value={name ?? ""}
            onchange={(e) => setName(e.target.value)}
            placeholder={"Facility Name"}
            required={true}
          />
          <InputBox
            value={contactInfo.email ?? ""}
            onchange={(e) =>
              setContactInfo((prevContactInfo) => ({
                ...prevContactInfo,
                email: e.target.value,
              }))
            }
            placeholder="Email Address"
            required={true}
          />
          <InputBox
            value={contactInfo.phone ?? ""}
            onchange={(e) =>
              setContactInfo((prevContactInfo) => ({
                ...prevContactInfo,
                phone: e.target.value,
              }))
            }
            placeholder="Phone Number"
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
                placeholder="Street Address 1"
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
                placeholder="Country"
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
                placeholder="City"
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
                placeholder="Street Address 2"
              />
              <InputBox
                value={address.state ?? ""}
                onchange={(e) =>
                  setAddress((prevAddress) => ({
                    ...prevAddress,
                    state: e.target.value,
                  }))
                }
                placeholder="State"
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
                placeholder="ZIP Code"
                required={true}
              />
            </div>
          </div>
          <SelectOption
            required={true}
            value={company ?? ""}
            onChange={handleCompanyChange}
            options={Array.isArray(companies) ? companies : []}
            placeholder="Company"
          />
          <SelectOption
            value={manager ?? ""}
            onChange={(e) => setManager(e.target.value)}
            options={Array.isArray(managers) ? managers : []}
            placeholder="Manager"
          />
        </div>
      }
      responseContent={
        <div className="flex justify-end">
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
            className="ml-4 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-gray-700 focus:outline-none focus:border-gray-700 focus:ring focus:ring-gray-200 transition ease-in duration-200"
          >
            Close
          </button>
        </div>
      }
    />
  );
}
