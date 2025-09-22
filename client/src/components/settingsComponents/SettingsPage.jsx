import { useParams } from "react-router-dom";
import StripeSettings from "./StripeSettings";
import PortfolioUpdates from "./ProtfolioUpdates";

export default function SettingsPage() {
  const { id } = useParams();

  const settings = {
    stripe: <StripeSettings />,
    "portfolio-updates": <PortfolioUpdates />,
  };

  return (
    <div className="flex flex-col h-full w-full relative dark:bg-slate-800 dark:text-white">
      {settings[id] || <p>Setting not found.</p>}
    </div>
  );
}
