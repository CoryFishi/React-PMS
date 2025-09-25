export default function RentalStepCompany({
  companies,
  selectedCompanyId,
  isLoading,
  onSelectCompany,
}) {
  if (isLoading) {
    return <p className="px-3 py-2">Loading companies...</p>;
  }

  if (!companies?.length) {
    return (
      <div className="px-3 py-6 text-center text-sm text-gray-500">
        No companies are available for online rentals yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3 py-2">
      {companies.map((company) => {
        const isSelected = selectedCompanyId === company._id;
        return (
          <div
            key={company._id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded border p-4 shadow-sm transition ${
              isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
            }`}
          >
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">{company.companyName}</h3>
              <p className="text-sm text-gray-600">
                {company.address?.street1}
                {company.address?.street2 ? `, ${company.address.street2}` : ""}
              </p>
              <p className="text-sm text-gray-600">
                {company.address?.city}, {company.address?.state}{" "}
                {company.address?.zipCode}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectCompany(company)}
              className={`rounded px-4 py-2 text-sm font-semibold transition ${
                isSelected
                  ? "bg-blue-700 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSelected ? "Selected" : "Select"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
