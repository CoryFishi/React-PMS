import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_KEY = import.meta.env.VITE_API_KEY;

export default function RentalStepThree({ onNext, onBack }) {
  const [unit, setUnit] = useState(null);
  const [facility, setFacility] = useState(null);
  const [insurance, setInsurance] = useState(null);
  const { companyId, facilityId, unitId } = useParams();
  const navigate = useNavigate();
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [user, setUser] = useState(null);

  const register = async () => {
    try {
      const { data } = await axios.put(
        `/facilities/${facilityId}/tenants`,
        {
          unitId: unit._id,
          insurancePlanId: selectedInsurance?._id || null,
          user: user,
        },
        {
          headers: { "x-api-key": API_KEY },
        }
      );
      setUser(data.user);
      toast.success("Successfully registered!");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Registration failed");
    }
  };

  useEffect(() => {
    if (unitId) {
      axios
        .get(`/rental/${companyId}/${facilityId}/${unitId}`, {
          headers: { "x-api-key": API_KEY },
        })
        .then(({ data }) => {
          setFacility(data.facility);
          setUnit(data.unit);
          setInsurance(data.insurancePlans);
        });
    }
  }, [unitId, facilityId, companyId]);

  if (!unit || !facility) return <p>Loading...</p>;

  const total =
    (unit.paymentInfo?.pricePerMonth ?? 0) +
    (selectedInsurance?.monthlyPrice ?? 0);

  return (
    <div className="grid grid-cols-2 gap-3 py-2 px-3">
      {/* LEFT: UNIT DETAILS */}
      <div className="bg-gray-50 p-4 rounded border">
        <h2 className="text-lg font-semibold mb-2">Unit Details</h2>
        <hr className="mb-3" />
        <p className="font-bold">Unit {unit.unitNumber}</p>
        <p className="text-sm">
          {unit.specifications?.width}x{unit.specifications?.depth}x
          {unit.specifications?.height} {unit.specifications?.unit}
        </p>
        <p className="mb-2">${unit.paymentInfo?.pricePerMonth}/mo</p>
        <p className="font-bold">{facility.facilityName}</p>
        <p className="text-sm">{facility.address.street1}</p>
        <p className="text-sm mb-2">
          {facility.address.city}, {facility.address.state}{" "}
          {facility.address.zipCode}
        </p>
        <p className="font-bold">{selectedInsurance?.name} Plan</p>
        <p className="text-sm">
          {selectedInsurance
            ? `$${selectedInsurance.monthlyPrice.toFixed(2)} / month`
            : "No insurance selected"}
        </p>
      </div>

      {/* RIGHT: PRICING INFO */}
      <div className="bg-white p-4 border rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Rental Information</h2>

        {/* First Month */}
        <div className="border p-3 mb-2">
          <p>
            <strong>First Month Rent:</strong> $
            {unit.paymentInfo?.pricePerMonth.toFixed(2)}
          </p>
        </div>

        {/* Insurance */}
        <div className="border px-3 py-1 pb-2 mb-2 max-h-40">
          <h2 className="font-bold">Insurance Plans:</h2>
          <p className="text-sm text-red-500">
            These are development filler plans. These are not real plans.
          </p>
          {insurance?.length > 0 ? (
            insurance.map((plan) => (
              <div
                key={plan._id}
                className={`flex items-center gap-4 p-2 border rounded cursor-pointer ${
                  selectedInsurance?._id === plan._id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300"
                }`}
                onClick={() => setSelectedInsurance(plan)}
              >
                <input
                  type="radio"
                  name="insurancePlan"
                  value={plan._id}
                  className="h-5 w-5 accent-blue-600"
                  onChange={() => setSelectedInsurance(plan)}
                  checked={selectedInsurance?._id === plan._id}
                />
                <h2 className="font-semibold">{plan.name} Plan</h2>
                <p>
                  <strong>Price:</strong> ${plan.monthlyPrice.toFixed(2)}
                </p>
                <p>
                  <strong>Coverage:</strong> $
                  {plan.coverageAmount.toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p>No insurance plans available</p>
          )}
        </div>

        {/* Summary */}
        <div className="border p-3">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </p>
          <p className="flex justify-end">
            <span className="text-zinc-300 ">Taxes calculated at checkout</span>
          </p>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              onBack();
            }}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Back
          </button>
          <button
            onClick={async () => {
              await register();
              onNext();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Register & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
