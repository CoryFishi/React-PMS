const formatMoney = (value) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function RentalStepFive({
  company,
  facility,
  unit,
  selectedInsurance,
  tenantInfo,
  onBack,
  onCheckout,
  isSubmitting,
}) {
  const stripePrice = unit?.stripe?.priceAmount;
  const baseRent =
    typeof stripePrice === "number"
      ? stripePrice / 100
      : unit?.paymentInfo?.pricePerMonth ?? 0;
  const insuranceAmount = selectedInsurance?.monthlyPrice ?? 0;
  const totalDue = baseRent + insuranceAmount;

  const readyForCheckout = Boolean(
    unit && company && facility && tenantInfo?.email
  );

  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      <div className="rounded border bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Review your rental</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500">
              Company
            </h3>
            <p className="text-lg font-semibold">{company?.companyName}</p>
            <p className="text-sm text-gray-600">
              {company?.address?.street1}
              {company?.address?.street2 ? `, ${company.address.street2}` : ""}
            </p>
            <p className="text-sm text-gray-600">
              {company?.address?.city}, {company?.address?.state}{" "}
              {company?.address?.zipCode}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500">
              Facility
            </h3>
            <p className="text-lg font-semibold">{facility?.facilityName}</p>
            <p className="text-sm text-gray-600">
              {facility?.address?.street1}
            </p>
            <p className="text-sm text-gray-600">
              {facility?.address?.city}, {facility?.address?.state}{" "}
              {facility?.address?.zipCode}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500">
              Unit
            </h3>
            <p className="text-lg font-semibold">Unit {unit?.unitNumber}</p>
            <p className="text-sm text-gray-600">
              {unit?.specifications?.width}x{unit?.specifications?.depth}x
              {unit?.specifications?.height} {unit?.specifications?.unit}
            </p>
            <p className="text-sm text-gray-600">
              {unit?.climateControlled ? "Climate Controlled" : "Standard"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500">
              Renter
            </h3>
            <p className="text-lg font-semibold">
              {[tenantInfo?.firstName, tenantInfo?.lastName]
                .filter(Boolean)
                .join(" ") || "-"}
            </p>
            <p className="text-sm text-gray-600">{tenantInfo?.email || "-"}</p>
            <p className="text-sm text-gray-600">{tenantInfo?.phone || "-"}</p>
          </div>
        </div>
      </div>

      <div className="rounded border bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">Payment summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Monthly Rent</span>
            <span>${formatMoney(baseRent)}</span>
          </div>
          <div className="flex justify-between">
            <span>
              Insurance
              {selectedInsurance?.name ? ` (${selectedInsurance.name})` : ""}
            </span>
            <span>
              {selectedInsurance
                ? `$${formatMoney(insuranceAmount)}`
                : "Not added"}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Taxes & fees</span>
            <span>Calculated during checkout</span>
          </div>
          <hr />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total due today</span>
            <span>
              ${formatMoney(totalDue)}{" "}
              <span className="font-thin">+ taxes & fees</span>
            </span>
          </div>
        </div>
        {!readyForCheckout && (
          <p className="mt-3 text-sm text-red-500">
            Complete the previous steps and provide a valid email address to
            continue to payment.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded bg-gray-300 px-4 py-2 text-sm font-semibold"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onCheckout}
            disabled={!readyForCheckout || isSubmitting}
            className={`rounded px-6 py-2 text-sm font-semibold text-white transition ${
              !readyForCheckout || isSubmitting
                ? "cursor-not-allowed bg-blue-300"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Starting checkout..." : "Continue to payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
