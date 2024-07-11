import { useState } from "react";
import UnitDetailReport from "../reportsComponents/UnitDetailReport";
import TenantDetailReport from "../reportsComponents/TenantDetailReport";
import DelinquencyReport from "../reportsComponents/DelinquencyReport";
import VacancyReport from "../reportsComponents/VacancyReport";
import PaymentsReport from "../reportsComponents/PaymentsReport";
import ApplicationEventsReport from "../reportsComponents/ApplicationEventsReport";

export default function ReportsPage({ facilityId }) {
  const [selectedReport, setSelectedReport] = useState(null);

  const reports = [
    {
      name: "Unit List**",
      component: <UnitDetailReport facilityId={facilityId} />,
    },
    { name: "Tenant List", component: <TenantDetailReport /> },
    { name: "Delinquent Tenants", component: <DelinquencyReport /> },
    { name: "Vacancy List", component: <VacancyReport /> },
    { name: "Payments", component: <PaymentsReport /> },
    { name: "Application Events", component: <ApplicationEventsReport /> },
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
