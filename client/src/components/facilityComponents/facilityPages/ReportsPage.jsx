import { useState, useEffect } from "react";
import UnitDetailReport from "../reportsComponents/UnitDetailReport";
import TenantDetailReport from "../reportsComponents/TenantDetailReport";
import DelinquencyReport from "../reportsComponents/DelinquencyReport";
import VacancyReport from "../reportsComponents/VacancyReport";
import PaymentsReport from "../reportsComponents/PaymentsReport";
import ApplicationEventsReport from "../reportsComponents/ApplicationEventsReport";
import { FaLock, FaPerson } from "react-icons/fa6";
import {
  MdPayments,
  MdSettingsApplications,
  MdIntegrationInstructions,
} from "react-icons/md";
import GateIntegrationReport from "../reportsComponents/GateIntegrationReport";
import { useParams, useNavigate } from "react-router-dom";

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const { facilityId, id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setSelectedReport(id || null);
  }, [id]);

  const reports = {
    "unit-detail": <UnitDetailReport facilityId={facilityId} />,
    allTenants: <TenantDetailReport facilityId={facilityId} />,
    delinquentTenants: <DelinquencyReport facilityId={facilityId} />,
    "unit-vacancy": <VacancyReport facilityId={facilityId} />,
    applicationEvents: <ApplicationEventsReport facilityId={facilityId} />,
    payments: <PaymentsReport facilityId={facilityId} />,
    gateIntegration: <GateIntegrationReport facilityId={facilityId} />,
  };

  return (
    <div className="p-5 dark:text-white">
      {selectedReport === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {/* Units Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaLock className="mb-2 text-blue-500" />
            <h1>STORAGE UNITS</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() =>
                navigate(`/dashboard/${facilityId}/reports/unit-detail`)
              }
            >
              Unit Detail
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() =>
                navigate(`/dashboard/${facilityId}/reports/unit-vacancy`)
              }
            >
              Vacant Units
            </button>
          </div>

          {/* Tenant Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <FaPerson className="mb-2 text-blue-500" />
            <h1>TENANTS</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("allTenants")}
            >
              Tenant Detail
            </button>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("delinquentTenants")}
            >
              Delinquent Tenants
            </button>
          </div>

          {/* Payments Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <MdPayments className="mb-2 text-blue-500" />
            <h1>PAYMENTS</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("payments")}
            >
              Payments
            </button>
          </div>

          {/* Application Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <MdSettingsApplications className="mb-2 text-blue-500" />
            <h1>APPLICATION</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("applicationEvents")}
            >
              Application Events
            </button>
          </div>

          {/* Delinquency Section */}
          <div className="w-full flex flex-col items-center text-2xl">
            <MdIntegrationInstructions className="mb-2 text-blue-500" />
            <h1>INTEGRATIONS</h1>
            <button
              className="w-full my-1 p-4 border bg-white dark:bg-darkSecondary dark:hover:bg-darkPrimary dark:border-border rounded-lg shadow-md text-lg font-bold flex justify-center items-center hover:bg-gray-200"
              onClick={() => setSelectedReport("gateIntegration")}
            >
              Gate Integration
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            className="mb-4 px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
            onClick={() => navigate(`/dashboard/${facilityId}/reports`)}
          >
            Back to Reports
          </button>
          {reports[selectedReport]}
        </div>
      )}
    </div>
  );
}
