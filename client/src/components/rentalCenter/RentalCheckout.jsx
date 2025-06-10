import { useParams } from "react-router-dom";
import RentalStepOne from "./steps/RentalStepOne";
import RentalStepTwo from "./steps/RentalStepTwo";
import RentalStepThree from "./steps/RentalStepThree";
import RentalStepFour from "./steps/RentalStepFour";
import RentalStepFive from "./steps/RentalStepFive";
import RentalStepSix from "./steps/RentalStepSix";
import { useState, useEffect } from "react";

const steps = [
  { id: 1, title: "Select a Location", component: RentalStepOne },
  { id: 2, title: "Select a Unit", component: RentalStepTwo },
  { id: 3, title: "Customize Your Unit", component: RentalStepThree },
  { id: 4, title: "Additional Information", component: RentalStepFour },
  { id: 5, title: "Payment Information", component: RentalStepFive },
  { id: 6, title: "Finish Move-In", component: RentalStepSix },
];

export default function RentalCheckout() {
  const { companyId, facilityId, unitId } = useParams();

  const computeIndex = () => {
    if (unitId) return 2;
    if (facilityId) return 1;
    if (companyId) return 0;
    return 0;
  };
  const [stepIndex, setStepIndex] = useState(computeIndex());

  useEffect(() => {
    setStepIndex(computeIndex());
  }, [companyId, facilityId, unitId]);

  const CurrentStep = steps[stepIndex].component;

  return (
    <div className="max-w-5xl mx-auto p-5">
      <h1 className="text-xl font-bold mb-4">Move-In Process</h1>
      <div>
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex flex-col border ${
              i === stepIndex ? "" : "text-zinc-500"
            }`}
          >
            <div
              className={`flex items-start gap-2 px-3 py-2 ${
                i === stepIndex ? "bg-zinc-600 text-white" : ""
              } ${i <= stepIndex ? "cursor-pointer" : "cursor-not-allowed"}`}
              onClick={() => {
                if (i < stepIndex) {
                  setStepIndex(i);
                }
              }}
            >
              <span>{i + 1}.</span>
              <span>{step.title}</span>
            </div>
            {stepIndex === i && (
              <CurrentStep
                onNext={() => setStepIndex((prev) => prev + 1)}
                onBack={() => setStepIndex((prev) => prev - 1)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
