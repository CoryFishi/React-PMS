import { useParams } from "react-router-dom";
import RentalStepOne from "./steps/RentalStepOne";
import RentalStepTwo from "./steps/RentalStepTwo";
import RentalStepThree from "./steps/RentalStepThree";
import RentalStepFour from "./steps/RentalStepFour";
import RentalStepFive from "./steps/RentalStepFive";
import RentalStepSix from "./steps/RentalStepSix";
import { useState, useEffect } from "react";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function RentalCheckout() {
  const { companyId, facilityId, unitId } = useParams();
  const [company, setCompany] = useState(null);

  const computeIndex = () => {
    if (unitId) return 2;
    if (facilityId) return 1;
    if (companyId) return 0;
    return 0;
  };

  const handleCheckout = async () => {
    if (selectedInsurance === null)
      return toast.error("Please select an insurance plan");
    try {
      const { data } = await axios.post(
        `/companies/${companyId}/checkout-session`,
        {
          priceInCents: Math.round(total * 100),
          companyStripeAccountId: facility.company?.stripe?.accountId,
          url: `${window.location}`,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      window.location.href = data.url;
    } catch (err) {
      console.error("Failed to start checkout:", err);
    }
  };

  const [stepIndex, setStepIndex] = useState(computeIndex());

  const getCompany = async () => {
    try {
      const { data } = await axios.get(`/rental/${companyId}`, {
        headers: { "x-api-key": API_KEY },
        withCredentials: true,
      });
      document.title = data?.companyName;
      const favicon = document.querySelector("link[rel='icon']");
      favicon.href = data?.logo;
      setCompany(data);
    } catch (err) {
      console.error("Error getting company data:", err);
      toast.error("Failed to open company data.");
    }
  };

  useEffect(() => {
    setStepIndex(computeIndex());
  }, [companyId, facilityId, unitId]);

  useEffect(() => {
    getCompany();
  }, [companyId]);

  return (
    <div className="max-w-5xl mx-auto p-5">
      <div className="flex items-center gap-1">
        <img
          src={company?.logo}
          alt={`${company?.companyName} logo`}
          className="mb-4 max-h-8"
        />
        <h1 className="text-xl font-bold mb-4">{company?.companyName}</h1>
      </div>

      <div className="flex flex-col border">
        <div
          className={`flex items-start gap-2 px-3 py-2 ${
            stepIndex === 0 ? "bg-zinc-600 text-white" : "text-zinc-500"
          } ${stepIndex >= 0 ? "cursor-pointer" : "cursor-not-allowed"}`}
          onClick={() => stepIndex > 0 && setStepIndex(0)}
        >
          <span>1.</span>
          <span>Select a Location</span>
        </div>
        {stepIndex === 0 && (
          <RentalStepOne
            onNext={() => setStepIndex(1)}
            onBack={() => setStepIndex(0)}
          />
        )}
      </div>

      <div className="flex flex-col border">
        <div
          className={`flex items-start gap-2 px-3 py-2 ${
            stepIndex === 1 ? "bg-zinc-600 text-white" : "text-zinc-500"
          } ${stepIndex >= 1 ? "cursor-pointer" : "cursor-not-allowed"}`}
          onClick={() => stepIndex > 1 && setStepIndex(1)}
        >
          <span>2.</span>
          <span>Select a Unit</span>
        </div>
        {stepIndex === 1 && (
          <RentalStepTwo
            onNext={() => setStepIndex(2)}
            onBack={() => setStepIndex(0)}
          />
        )}
      </div>

      <div className="flex flex-col border">
        <div
          className={`flex items-start gap-2 px-3 py-2 ${
            stepIndex === 2 ? "bg-zinc-600 text-white" : "text-zinc-500"
          } ${stepIndex >= 2 ? "cursor-pointer" : "cursor-not-allowed"}`}
          onClick={() => stepIndex > 2 && setStepIndex(2)}
        >
          <span>3.</span>
          <span>Customize Your Unit</span>
        </div>
        {stepIndex === 2 && (
          <RentalStepThree
            onNext={() => setStepIndex(3)}
            onBack={() => setStepIndex(1)}
          />
        )}
      </div>

      <div className="flex flex-col border">
        <div
          className={`flex items-start gap-2 px-3 py-2 ${
            stepIndex === 3 ? "bg-zinc-600 text-white" : "text-zinc-500"
          } ${stepIndex >= 3 ? "cursor-pointer" : "cursor-not-allowed"}`}
          onClick={() => stepIndex > 3 && setStepIndex(3)}
        >
          <span>4.</span>
          <span>Additional Information</span>
        </div>
        {stepIndex === 3 && (
          <RentalStepFour
            onNext={() => setStepIndex(4)}
            onBack={() => setStepIndex(2)}
          />
        )}
      </div>

      <div className="flex flex-col border">
        <div
          className={`flex items-start gap-2 px-3 py-2 ${
            stepIndex === 4 ? "bg-zinc-600 text-white" : "text-zinc-500"
          } ${stepIndex >= 4 ? "cursor-pointer" : "cursor-not-allowed"}`}
          onClick={() => stepIndex > 4 && setStepIndex(4)}
        >
          <span>5.</span>
          <span>Payment Information</span>
        </div>
        {stepIndex === 4 && (
          <RentalStepFive
            onNext={() => setStepIndex(5)}
            onBack={() => setStepIndex(3)}
          />
        )}
      </div>

      <div className="flex flex-col border">
        <div
          className={`flex items-start gap-2 px-3 py-2 ${
            stepIndex === 5 ? "bg-zinc-600 text-white" : "text-zinc-500"
          } ${stepIndex >= 5 ? "cursor-pointer" : "cursor-not-allowed"}`}
          onClick={() => setStepIndex(5)}
        >
          <span>6.</span>
          <span>Finish Move-In</span>
        </div>
        {stepIndex === 5 && (
          <RentalStepSix onNext={() => {}} onBack={() => setStepIndex(4)} />
        )}
      </div>
    </div>
  );
}
