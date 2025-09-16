import { useState, useEffect } from "react";
import UnitDetailReport from "../reportsComponents/UnitDetailReport";
import TenantDetailReport from "../reportsComponents/TenantDetailReport";
import DelinquencyReport from "../reportsComponents/DelinquencyReport";
import VacancyReport from "../reportsComponents/VacancyReport";
import PaymentsReport from "../reportsComponents/PaymentsReport";
import ApplicationEventsReport from "../reportsComponents/ApplicationEventsReport";
import IntegrationReport from "../reportsComponents/IntegrationReport";
import { useParams } from "react-router-dom";

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null);
  const { facilityId, id } = useParams();

  useEffect(() => {
    setSelectedReport(id || null);
  }, [id]);

  const reports = {
    "unit-detail": <UnitDetailReport facilityId={facilityId} />,
    "tenant-detail": <TenantDetailReport facilityId={facilityId} />,
    "delinquency-detail": <DelinquencyReport facilityId={facilityId} />,
    "unit-vacancy": <VacancyReport facilityId={facilityId} />,
    "application-events": <ApplicationEventsReport facilityId={facilityId} />,
    "payments-detail": <PaymentsReport facilityId={facilityId} />,
    "integrations-detail": <IntegrationReport facilityId={facilityId} />,
  };

  return <div className="dark:text-white">{reports[selectedReport]}</div>;
}
