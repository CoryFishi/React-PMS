import axios from "axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ModalContainer from "../sharedComponents/ModalContainer";
import InputBox from "../sharedComponents/InputBox";
const API_KEY = import.meta.env.VITE_API_KEY;
import SelectOption from "../sharedComponents/SelectOption";

export default function EditFacility({ facilityId, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState({
    street1: "",
    street2: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
  });
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState([]);
  const [manager, setManager] = useState("");
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    axios
      .get(`/facilities/${facilityId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setName(data.facilityName);
        setStatus(data.status);
        setAddress(data.address);
        setContactInfo(data.contactInfo);
        setCompany(data.company);
        setManager(data.manager);
      });

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
          setManagers(
            data.map((m) => ({
              id: m._id,
              name: m.name,
            }))
          );
        });
    }
  }, [company]);

  const handleCompanyChange = (e) => {
    const selectedCompany = e;
    setCompany(selectedCompany);
    setManager("");
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `/facilities/update`,
        {
          facilityName: name,
          contactInfo,
          status: status,
          address: address,
          company: company,
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

      onSubmit(response);
    } catch (error) {
      console.error("Failed to update facility:", error);
      toast.error(error.response.data.error);
    }
  };

  return (
    <ModalContainer
      title={`Editing ${facilityId}`}
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
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-auto shadow-sm hover:bg-blue-700 focus:outline-none focus:border-blue-700 focus:ring focus:ring-blue-200 transition ease-in duration-200"
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
