import axios from "axios";
import { useContext } from "react";
import { useState, useEffect } from "react";
const API_KEY = import.meta.env.VITE_API_KEY;
import { UserContext } from "../../../context/userContext";
import toast from "react-hot-toast";
import { IoRefreshCircle } from "react-icons/io5";
import SelectOption from "../sharedComponents/SelectOption";

export default function StripeSettings({}) {
  const [stripeSettings, setStripeSettings] = useState([]);
  const { user } = useContext(UserContext);
  const [companyId, setCompanyId] = useState(user?.company);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    refreshStripeSettings(companyId);
    stripe();
    // Fetch companies if user is admin or system user
    if (user.role === "System_Admin" || user.role === "System_User") {
      axios
        .get(`/companies`, {
          headers: { "x-api-key": API_KEY },
          withCredentials: true,
        })
        .then((response) => {
          console.log("Fetched companies:", response.data);
          setCompanies(
            response.data.map((company) => ({
              id: company._id || company.id,
              name: company.companyName,
            }))
          );
        })
        .catch((error) => {
          console.error("Error fetching companies:", error);
        });
    }
  }, [companyId]);

  const stripe = async () => {
    try {
      const { data } = await axios.get(
        `/companies/${companyId}/stripe-requirements`,
        {
          headers: { "x-api-key": API_KEY },
          withCredentials: true,
        }
      );

      console.log(data);
    } catch (err) {
      console.error("Error getting Stripe onboarding status:", err);
      toast.error("Failed to check onboarding status.");
    }
  };

  const openStripeDashboardLink = async () => {
    try {
      const { data } = await axios.get(
        `/companies/${companyId}/stripe-dashboard-link`,
        {
          headers: { "x-api-key": API_KEY },
          withCredentials: true,
        }
      );

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Failed to get Stripe dashboard link.");
      }
    } catch (err) {
      console.error("Error getting Stripe dashboard link:", err);
      toast.error("Failed to open Stripe dashboard.");
    }
  };

  const refreshStripeSettings = async () => {
    try {
      const { data } = await axios.get(
        `/companies/${companyId}/settings/stripe`,
        {
          headers: {
            "x-api-key": API_KEY,
          },
          withCredentials: true,
        }
      );
      console.log(data);
      setStripeSettings(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const checkOnboardingStatus = async () => {
    if (!companyId) {
      alert("No company ID found");
      return;
    }

    try {
      const { data } = await axios.get(
        `/companies/${companyId}/stripe-onboarding-status`,
        {
          headers: { "x-api-key": API_KEY },
          withCredentials: true,
        }
      );

      if (data.isComplete) {
        toast.success("Onboarding is complete!");
        setStripeSettings((prev) => ({
          ...prev,
          onboardingComplete: true,
        }));
      } else {
        toast.error("Onboarding is not complete yet.");
      }
    } catch (err) {
      console.error("Error checking onboarding status:", err);
      toast.error("Failed to check onboarding status.");
    }
  };

  const handleGenerateStripeLink = async () => {
    try {
      const { data } = await axios.post(
        `/companies/${companyId}/stripe-onboarding`,
        {},
        {
          headers: {
            "x-api-key": API_KEY,
          },
          withCredentials: true,
        }
      );
      console.log("Stripe link data:", data);
      if (data.url) {
        window.location.href = data.url;
      } else if (data.company) {
        // Onboarding already complete
        alert("Onboarding is already complete for this company.");
      }
    } catch (err) {
      console.error("Error generating Stripe onboarding link:", err);
      alert("Failed to initiate Stripe onboarding.");
    }
  };

  if (
    !companyId &&
    (user.role === "System_Admin" || user.role === "System_User")
  ) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <div className="justify-between flex flex-col gap-5 min-w-48">
          <SelectOption
            type="company"
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="Select a Company"
            value={companyId}
            required={true}
            options={companies}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-col p-5 w-full h-full">
      <div className="w-full justify-between flex">
        <button
          onClick={() => refreshStripeSettings()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-24"
        >
          Refresh
        </button>
        {stripeSettings.accountId && (
          <button
            onClick={openStripeDashboardLink}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Login to Stripe Dashboard
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <h2 className="font-bold">Last Synced:</h2>
          <p>{stripeSettings.lastRequirementsSync}</p>
        </div>
        <div className="flex gap-2">
          <h2 className="font-bold">Stripe Account ID:</h2>
          <p>{stripeSettings.accountId}</p>
        </div>
        <div className="flex items-center">
          <h2 className="font-bold">Onboarding Complete?:</h2>
          <p className="ml-2">
            {stripeSettings.onboardingComplete ? "Yes" : "No"}
          </p>
          {!stripeSettings.onboardingComplete && (
            <>
              <button
                onClick={checkOnboardingStatus}
                className="text-blue-600 hover:text-blue-700 rounded text-lg"
              >
                <IoRefreshCircle />
              </button>
              <button
                onClick={handleGenerateStripeLink}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ml-5"
              >
                Complete Onboarding
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
