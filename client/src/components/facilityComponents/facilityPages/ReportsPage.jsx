import { useState } from "react";
import GeneralSettings from "../settingsComponents/GeneralSettings";
import TenantManagementSettings from "../settingsComponents/TenantManagementSettings";

export default function ReportsPage({ facilityId }) {
  const [selectedReport, setSelectedReport] = useState(null);

  const reports = [
    { name: "Unit List", component: <GeneralSettings /> },
    { name: "Tenant List", component: <TenantManagementSettings /> },
    { name: "Delinquent Tenants", component: <GeneralSettings /> },
    { name: "Tenant List", component: <TenantManagementSettings /> },
    { name: "Unit List", component: <GeneralSettings /> },
    { name: "Tenant List", component: <TenantManagementSettings /> },
  ];

  return (
    <div className="p-5 text-text-950">
      {selectedReport === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report, index) => (
            <button
              key={index}
              className="p-10 bg-white rounded-lg shadow-md text-xl font-bold flex justify-center items-center h-48 hover:bg-gray-200"
              onClick={() => setSelectedReport(index)}
            >
              {report.name}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-700"
            onClick={() => setSelectedReport(null)}
          >
            Back to Reports
          </button>
          {reports[selectedReport].component}
        </div>
      )}
    </div>
  );
}
