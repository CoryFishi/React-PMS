import { useParams } from "react-router-dom";
import StripeSettings from "./StripeSettings";
import PortfolioUpdates from "./ProtfolioUpdates";
import GateCredentialsSettings from "./GateCredentialsSettings";

export default function SettingsPage() {
  const { id } = useParams();

  const settings = {
    stripe: <StripeSettings />,
    "portfolio-updates": <PortfolioUpdates />,
    "gate-credentials": <GateCredentialsSettings />,
  };

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-slate-800 dark:text-white">
      {settings[id] || <p>Setting not found.</p>}
    </div>
  );
}
