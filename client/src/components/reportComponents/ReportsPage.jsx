import { useParams } from "react-router-dom";
import UserDetailReport from "./UserDetailReport";
import CompanyDetailReport from "./CompanyDetailReport";
import FacilityDetailReport from "./FacilityDetailReport";
import ApplicationEventsReport from "./ApplicationEventsReport";

export default function ReportsPage() {
  const { id } = useParams();

  const reports = {
    "user-detail": <UserDetailReport />,
    "company-detail": <CompanyDetailReport />,
    "facilities-detail": <FacilityDetailReport />,
    "events-detail": <ApplicationEventsReport />,
  };

  return (
    <div className="dark:text-white overflow-auto">
      <div className="p-5">{reports[id] || <p>Report not found.</p>}</div>
    </div>
  );
}
