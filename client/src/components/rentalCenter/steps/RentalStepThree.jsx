import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function RentalStepThree({
  onNext,
  onBack,
  selectedInsurance,
  onSelectInsurance,
  unit,
  facility,
  moveInDate,
  setMoveInDate,
}) {
  const [insurance, setInsurance] = useState([
    {
      _id: "1",
      name: "Use my homeowners/renters insurance",
      description:
        "I understand and agree that while this self-storage facility takes precautions to provide clean, dry, and secure storage rooms, that it does not insure my goods and has no responsibility to provide insurance. Also, this storage facility is not responsible for damage or loss that may occur to my goods while in storage. I understand that this storage facility requires that I maintain insurance to cover my goods for as long as they are in storage.",
      monthlyPrice: 0,
      coverageAmount: 0,
    },
  ]);
  const { companyId, facilityId } = useParams();
  const navigate = useNavigate();

  if (!unit) return <p className="px-3 py-2">Loading unit details...</p>;

  const baseRent = unit.paymentInfo?.pricePerMonth ?? 0;
  const insuranceAmount = selectedInsurance?.monthlyPrice ?? 0;
  const total = baseRent + insuranceAmount;

  const handleMoveInDateChange = (e) => {
    if (e.target.value < new Date().toISOString().split("T")[0]) {
      alert("Move-in date cannot be in the past.");
      return;
    }
    setMoveInDate(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 gap-3 px-3 py-2 md:grid-cols-2">
      <div className="rounded border bg-gray-50 p-4">
        <h2 className="mb-2 text-lg font-semibold">Unit Details</h2>
        <hr className="mb-3" />
        <p className="font-bold">Unit {unit.unitNumber}</p>
        <p className="text-sm text-gray-600">
          {unit.specifications?.width}x{unit.specifications?.depth}x
          {unit.specifications?.height} {unit.specifications?.unit}
        </p>
        <p className="mb-2 text-sm text-gray-600">${baseRent.toFixed(2)}/mo</p>
        <p className="font-bold">
          {facility?.facilityName ?? "Unknown Facility"}
        </p>
        <p className="text-sm text-gray-600">{facility?.address.street1}</p>
        <p className="mb-2 text-sm text-gray-600">
          {facility?.address.city}, {facility?.address.state}{" "}
          {facility?.address.zipCode}
        </p>
        <p className="font-bold">
          {selectedInsurance
            ? `${selectedInsurance.name} Plan`
            : "No insurance selected"}
        </p>
        <p className="text-sm text-gray-600">
          {selectedInsurance
            ? `$${selectedInsurance.monthlyPrice.toFixed(2)} / month`
            : "Select a plan or continue without insurance"}
        </p>
      </div>

      <div className="rounded border bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Rental Information</h2>
        <div className="mb-3 border p-3 text-sm">
          <p>
            <strong>First Month Rent:</strong> ${baseRent.toFixed(2)}
          </p>
        </div>
        <div className="mb-3 max-h-48 space-y-2 overflow-y-auto border px-3 py-2 text-sm">
          <h3 className="text-base font-semibold">Insurance Plans</h3>
          <p className="text-xs text-red-500">
            These are development filler plans. These are not real plans.
          </p>
          {insurance?.length ? (
            insurance.map((plan) => {
              const isSelected = selectedInsurance?._id === plan._id;
              return (
                <button
                  type="button"
                  key={plan._id}
                  onClick={() => onSelectInsurance?.(plan)}
                  className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left transition ${
                    isSelected
                      ? "border-sky-600 bg-sky-50"
                      : "border-gray-300 hover:border-sky-400"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">
                      {plan.name} Plan
                    </span>
                    <span className="block text-xs text-gray-600">
                      {plan.description}
                    </span>
                    {plan.coverageAmount > 0 && (
                      <span className="block text-xs text-gray-600">
                        Coverage ${plan.coverageAmount.toLocaleString()}
                      </span>
                    )}
                  </span>
                  {plan.monthlyPrice !== 0 && (
                    <span className="text-sm font-semibold">
                      ${plan.monthlyPrice.toFixed(2)} / mo
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <p>No insurance plans available.</p>
          )}
        </div>
        <div className="mb-3 border p-3 text-sm flex justify-between">
          <p className="flex justify-between">
            <span>Move In Date</span>
          </p>
          <input
            type="date"
            className="p-2 block border-gray-300 rounded-md shadow-sm focus:border-sky-500 focus:ring focus:ring-sky-500 focus:ring-opacity-50 w-1/2 cursor-pointer"
            value={moveInDate}
            onChange={handleMoveInDateChange}
          />
        </div>
        <div className="border p-3 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </p>
          <p className="flex justify-end text-xs text-gray-400">
            Taxes calculated at checkout
          </p>
        </div>
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => {
              navigate(`/rental/${companyId}/${facilityId}`);
              onBack();
            }}
            className="rounded bg-gray-300 px-4 py-2 text-sm font-semibold"
          >
            Back
          </button>
          <button
            type="button"
            onClick={async () => {
              onNext();
            }}
            className={`rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 ${
              !selectedInsurance && "opacity-50 cursor-not-allowed"
            }`}
            disabled={!selectedInsurance}
            title={
              !selectedInsurance
                ? "Please select an insurance plan to continue"
                : "Continue to registration"
            }
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
