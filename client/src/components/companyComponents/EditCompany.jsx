import axios from "axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ModalContainer from "../sharedComponents/ModalContainer";
import InputBox from "../sharedComponents/InputBox";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function EditCompany({ companyId, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState([]);
  const [oldAddress, setOldAddress] = useState([]);
  const [status, setStatus] = useState("Enabled");
  const [companyData, setCompanyData] = useState([]);
  const [contactInfo, setContactInfo] = useState([]);
  const [oldContactInfo, setOldContactInfo] = useState([]);
  const toggleStatus = () => {
    setStatus((prevState) =>
      prevState === "Enabled" ? "Disabled" : "Enabled"
    );
  };
  useEffect(() => {
    axios
      .get(`/companies/${companyId}`, {
        headers: {
          "x-api-key": API_KEY,
        },
      })
      .then(({ data }) => {
        setCompanyData(data);
        setName(data.companyName);
        setStatus(data.status);
        setAddress(data.address);
        setOldAddress(data.address);
        setContactInfo(data.contactInfo);
        setOldContactInfo(data.contactInfo);
      });
  }, []);
  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `/companies/update`,
        {
          companyName: name,
          contactInfo: {
            phone: contactInfo.phone,
            email: contactInfo.email,
          },
          status: status,
          address: address,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
          params: {
            companyId: companyId,
          },
        }
      );

      onSubmit(response);
    } catch (error) {
      console.error("Failed to update company:", error);
      toast.error(error.response?.data?.error || "An error occurred");
    }
  };

  return (
    <ModalContainer
      title={`Editing ${companyId}`}
      mainContent={
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-1">
          <InputBox
            value={name}
            onchange={(e) => setName(e.target.value)}
            placeholder={"Company Name"}
            required={true}
          />
          <InputBox
            value={contactInfo.email || ""}
            onchange={(e) =>
              setContactInfo((prevContact) => ({
                ...prevContact,
                email: e.target.value,
              }))
            }
            placeholder="Email Address"
            required={true}
          />
          <InputBox
            value={contactInfo.phone || ""}
            onchange={(e) =>
              setContactInfo((prevContact) => ({
                ...prevContact,
                phone: e.target.value,
              }))
            }
            placeholder="Phone Number"
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
                placeholder="Street Address 1"
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
                placeholder="Country"
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
                placeholder="City"
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
                placeholder="Street Address 2"
              />
              <InputBox
                value={address.state}
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
                value={address.zipCode}
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
          <div className="flex justify-between items-center">
            <div className="flex items-center justify-between">
              <label htmlFor="status" className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="status"
                  checked={status === "Enabled"}
                  onChange={toggleStatus}
                  className="mr-2"
                />
                <span>{status}</span>
              </label>
            </div>
            <h2>{companyData.facilities?.length} facility(s) assigned</h2>
          </div>
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
