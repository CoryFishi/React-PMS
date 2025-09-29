import { useParams, useNavigate } from "react-router-dom";

export default function RentalStepTwo({ onNext, onBack, onSelectUnit, units }) {
  const { facilityId, companyId } = useParams();
  const navigate = useNavigate();

  if (!facilityId) {
    return (
      <p className="px-3 py-2 text-sm text-gray-500">
        Choose a facility to see its available units.
      </p>
    );
  }

  if (!units) return <p className="px-3 py-2">Loading units...</p>;

  return (
    <div className="px-3 py-2">
      {units.length === 0 ? (
        <p>No available units at this facility.</p>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          {units.map((unit) => (
            <div
              key={unit._id}
              className="flex flex-col gap-3 rounded border p-4 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h3 className="font-bold text-lg">Unit {unit.unitNumber}</h3>
                <p className="text-sm text-gray-600">
                  {unit.specifications?.width}x{unit.specifications?.depth}{" "}
                  {unit.specifications?.unit ?? "ft"}
                </p>
                <p className="text-sm text-gray-600">
                  {unit.climateControlled ? "Climate Controlled" : "Standard"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 md:justify-end">
                <p className="font-semibold">
                  ${unit.paymentInfo?.pricePerMonth?.toFixed(2)} / month
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSelectUnit(unit);
                    navigate(`/rental/${companyId}/${facilityId}/${unit._id}`);
                    onNext?.();
                  }}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Move In
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          navigate(`/rental/${companyId}`);
          onBack();
        }}
        className="mt-4 w-fit rounded bg-gray-300 px-4 py-2 text-sm font-semibold text-black"
      >
        Back
      </button>
    </div>
  );
}
