import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

export default function PaymentTenant({ tenantId, onClose, onSubmit }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(null);
  const [email, setEmail] = useState(null);
  const [address, setAddress] = useState([]);
  const [status, setStatus] = useState("In Progress");
  const [accessCode, setAccessCode] = useState("");
  const [unitsDropdownOpen, setUnitsDropdownOpen] = useState(false);
  const [tenantData, setTenantData] = useState([]);
  const unitsDropdownRef = useRef(null);

  useEffect(() => {
    axios.get(`/tenants/${tenantId}`).then(({ data }) => {
      setTenantData(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhone(data.contactInfo?.phone);
      setEmail(data.contactInfo?.email);
      setAddress(data.address);
      setAccessCode(data.accessCode);
      setStatus(data.status);
    });
  }, [tenantId]);

  const handleSubmit = async () => {
    try {
      const response = await axios.put(`/tenants/update`, {
        tenantId,
        updateData: {
          firstName,
          lastName,
          contactInfo: {
            phone: phone,
            email: email,
          },
          accessCode,
          address,
          status,
        },
      });
      console.log(response);
      await onSubmit(response);
    } catch (error) {
      console.error("Failed to create tenant:", error);
      toast.error(error.response.data.error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        unitsDropdownRef.current &&
        !unitsDropdownRef.current.contains(event.target)
      ) {
        setUnitsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [unitsDropdownRef]);

  const togglePaidInCash = () => {
    setPaidInCash((prevState) => (prevState === true ? false : true));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 text-left">
      <div className="relative top-20 mx-auto p-5 w-fit shadow-lg shadow-background-50 rounded-md bg-background-100">
        <h2 className="text-xl font-bold text-text-950 mb-4">
          Payment options for {tenantData.firstName} {tenantData.lastName}
        </h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="flex justify-end pt-5">
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
        </form>
      </div>
    </div>
  );
}
