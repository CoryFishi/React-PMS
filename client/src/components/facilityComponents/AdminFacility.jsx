import axios from "axios";
import { useState, useEffect } from "react";
import FacilityDashboard from "./FacilityDashboard";

export default function AdminFacility() {
  const [companies, setCompanies] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [company, setCompany] = useState(
    localStorage.getItem("selectedCompany") || ""
  );
  const [facility, setFacility] = useState(
    localStorage.getItem("selectedFacility") || ""
  );

  useEffect(() => {
    axios.get("/companies").then(({ data }) => {
      setCompanies(data);
    });
  }, []);

  useEffect(() => {
    if (company) {
      axios.get(`/facilities&company?company=${company}`).then(({ data }) => {
        if (data.facilities != null) {
          localStorage.setItem("selectedCompany", company);
          setFacilities(data.facilities);
        } else {
          localStorage.removeItem("selectedCompany");
          setFacilities([]);
        }
      });
    } else {
      setFacilities([]);
      localStorage.removeItem("selectedCompany");
    }
  }, [company]);

  useEffect(() => {
    if (facility) {
      axios.get(`/facilities/${facility}`).then(({ data }) => {
        if (data) {
          localStorage.setItem("selectedFacility", facility);
          localStorage.setItem("selectedFacilityName", data.facilityName); // Assuming the response has facilityName
          window.dispatchEvent(new Event("storage")); // Manually trigger storage event
        } else {
          localStorage.removeItem("selectedFacility");
          localStorage.removeItem("selectedFacilityName");
          window.dispatchEvent(new Event("storage")); // Manually trigger storage event
        }
      });
    }
  }, [facility]);

  return (
    <>
      <div className="flex justify-end">
        <select
          name="company"
          id="company"
          value={company || ""}
          onChange={(e) =>
            setCompany(e.target.value) &
            setFacility("") &
            localStorage.removeItem("selectedFacility") &
            localStorage.removeItem("selectedFacilityName")
          }
          style={{ width: "17rem" }}
          className="text-black m-3 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select a company</option>
          {companies.map((company) => (
            <option key={company._id} value={company._id}>
              {company.companyName}
            </option>
          ))}
        </select>
        <select
          name="facility"
          id="facility"
          value={facility || ""}
          onChange={(e) =>
            setFacility(e.target.value) &
            setTimeout(() => {
              location.reload();
            }, 100)
          }
          style={{ width: "17rem" }}
          className="text-black m-3 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select a facility</option>
          {facilities.map((facility) => (
            <option key={facility._id} value={facility._id}>
              {facility.facilityName}
            </option>
          ))}
        </select>
      </div>
      {facility && <FacilityDashboard facilityId={facility} />}
    </>
  );
}
