import { useState } from "react";
import { FaPerson } from "react-icons/fa6";
import { BsBuildingFillLock, BsFillBuildingsFill } from "react-icons/bs";
import UserDetailReport from "./UserDetailReport";
import { MdSettingsApplications } from "react-icons/md";
import CompanyDetailReport from "./CompanyDetailReport";
import FacilityDetailReport from "./FacilityDetailReport";
import ApplicationEventsReport from "./ApplicationEventsReport";

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null);

  const reports = {
    allUsers: <UserDetailReport />,
    allCompanies: <CompanyDetailReport />,
    allFacilities: <FacilityDetailReport />,
    allEvents: <ApplicationEventsReport />,
  };

  return (
    <div className="p-5 dark:text-white">
      {selectedReport === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {/* Units Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaPerson className="mb-2 text-blue-500" />
            <h1>USERS</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("allUsers")}
            >
              User Detail
            </button>
          </div>
          {/* Companies Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <BsFillBuildingsFill className="mb-2 text-blue-500" />
            <h1>COMPANIES</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("allCompanies")}
            >
              Company Detail
            </button>
          </div>
          {/* Facilities Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <BsBuildingFillLock className="mb-2 text-blue-500" />
            <h1>FACILITIES</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("allFacilities")}
            >
              Facility Detail
            </button>
          </div>
          {/* Application Events Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <MdSettingsApplications className="mb-2 text-blue-500" />
            <h1>APPLICATION</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("allEvents")}
            >
              Events Detail
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
            onClick={() => setSelectedReport(null)}
          >
            Back to Reports
          </button>
          {reports[selectedReport]}
        </div>
      )}
    </div>
  );
}
