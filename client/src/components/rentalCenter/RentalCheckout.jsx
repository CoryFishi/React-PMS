import { useParams } from "react-router-dom";
import RentalStepOne from "./steps/RentalStepOne";
import RentalStepTwo from "./steps/RentalStepTwo";
import RentalStepThree from "./steps/RentalStepThree";
import RentalStepFour from "./steps/RentalStepFour";
import RentalStepFive from "./steps/RentalStepFive";
import RentalStepSix from "./steps/RentalStepSix";
import { useState } from "react";

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
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedFacilityId, setSelectedFacilityId] = useState(
    facilityId || null
  );
  const [selectedUnitId, setSelectedUnitId] = useState(unitId || null);

  const CurrentStep = steps[stepIndex].component;

  return (
    <div className="max-w-3xl mx-auto p-5">
      <h1 className="text-xl font-bold mb-4">Move-In Process</h1>
      <div className="mb-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 mb-1 ${
              i === stepIndex ? "font-bold" : "text-zinc-500"
            }`}
          >
            <span>{i + 1}.</span>
            <span>{step.title}</span>
          </div>
        ))}
      </div>

      <div className="border p-4 rounded bg-white shadow">
        <CurrentStep
          companyId={companyId}
          facilityId={selectedFacilityId}
          unitId={selectedUnitId}
          onUnitSelect={setSelectedUnitId}
          onFacilitySelect={setSelectedFacilityId}
          onNext={() => setStepIndex((prev) => prev + 1)}
          onBack={() => setStepIndex((prev) => prev - 1)}
        />
      </div>
    </div>
  );
}
