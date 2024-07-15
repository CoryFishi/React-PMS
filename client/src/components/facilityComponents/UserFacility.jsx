import axios from "axios";
import { useState, useEffect, useContext } from "react";
import FacilityDashboard from "./FacilityDashboard";
import { UserContext } from "../../../context/userContext";

export default function UserFacility() {
  const [facilities, setFacilities] = useState([]);
  const [company, setCompany] = useState([]);
  const { user } = useContext(UserContext);
  const [facility, setFacility] = useState(
    localStorage.getItem("selectedFacility") || ""
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user) {
          const userData = await userDataCaller(user);
          setCompany(userData.company);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle error if needed
      }
    };

    fetchUserData();
  }, [user]);

  const userDataCaller = async (contextData) => {
    try {
      const response = await axios.get(
        `/profile/compute?id=${contextData._id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (company !== 0) {
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
          localStorage.setItem("selectedFacilityName", data.facilityName);
        } else {
          localStorage.removeItem("selectedFacility");
          localStorage.removeItem("selectedFacilityName");
        }
      });
    }
  }, [facility]);

  return (
    <>
      <div className="flex justify-end">
        <label htmlFor="facility" className="mt-3 px-3 py-2">
          Facility:
        </label>
        <select
          name="facility"
          id="facility"
          value={facility || ""}
          onChange={(e) =>
            localStorage.removeItem("selectedFacility") &
            localStorage.removeItem("selectedFacilityName") &
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
