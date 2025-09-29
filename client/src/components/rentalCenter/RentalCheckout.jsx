import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import RentalStepCompany from "./steps/RentalStepCompany";
import RentalStepOne from "./steps/RentalStepOne";
import RentalStepTwo from "./steps/RentalStepTwo";
import RentalStepThree from "./steps/RentalStepThree";
import RentalStepFour from "./steps/RentalStepFour";
import RentalStepFive from "./steps/RentalStepFive";
import axios from "axios";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function RentalCheckout() {
  const { companyId, facilityId, unitId } = useParams();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [unitDetails, setUnitDetails] = useState(null);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [units, setUnits] = useState([]);
  const [facility, setFacility] = useState(null);

  const [stepIndex, setStepIndex] = useState(() => {
    if (!companyId) return 0;
    if (!facilityId) return 0;
    if (!unitId) return 1;
    return 2;
  });

  useEffect(() => {
    const loadCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const { data } = await axios.get("/rental/companies", {
          headers: { "x-api-key": API_KEY },
        });
        setCompanies(data);
      } catch (err) {
        console.error("Failed to load companies", err);
        toast.error("Unable to load companies for checkout");
      } finally {
        setCompaniesLoading(false);
      }
    };

    if (!companyId) {
      loadCompanies();
    }
  }, []);

  useEffect(() => {
    const loadCompanyDetails = async () => {
      if (!companyId) {
        setCompany(null);
        document.title = "Rental Checkout";
        return;
      }

      try {
        const { data } = await axios.get(`/rental/${companyId}`, {
          headers: { "x-api-key": API_KEY },
        });
        document.title = data?.companyName || "Rental Checkout";
        const favicon = document.querySelector("link[rel='icon']");
        if (favicon && data?.logo) {
          favicon.href = data.logo;
        }
        setCompany(data.company[0] || {});
      } catch (err) {
        console.error("Error getting company data:", err);
        toast.error("Failed to load company details");
      }
    };

    loadCompanyDetails();

    const loadFacilities = async () => {
      if (!companyId || facilityId) {
        setCompany(null);
        document.title = "Rental Checkout";
        return;
      }

      try {
        const { data } = await axios.get(`/rental/${companyId}/facilities`, {
          headers: { "x-api-key": API_KEY },
        });
        setFacilities(data.facilities || []);
      } catch (err) {
        console.error("Error getting company data:", err);
        toast.error("Failed to load company details");
      }
    };

    loadFacilities();
  }, [companyId, facilityId]);

  useEffect(() => {
    const loadFacilityDetails = async () => {
      if (!facilityId) {
        setFacility(null);
        return;
      }

      try {
        const { data } = await axios.get(`/rental/${companyId}/${facilityId}`, {
          headers: { "x-api-key": API_KEY },
        });
        setFacility(data.facility || {});
        setUnits(data?.facility?.units || []);
      } catch (err) {
        console.error("Error getting facility data:", err);
        toast.error("Failed to load facility details");
      }
    };

    loadFacilityDetails();
  }, [facilityId]);

  useEffect(() => {
    const loadUnitDetails = async () => {
      if (!unitId) {
        setUnitDetails(null);
        return;
      }

      try {
        const { data } = await axios.get(
          `/rental/${companyId}/${facilityId}/${unitId}`,
          {
            headers: { "x-api-key": API_KEY },
          }
        );
        setUnitDetails(data.unit || {});
      } catch (err) {
        console.error("Error getting unit data:", err);
        toast.error("Failed to load unit details");
      }
    };

    loadUnitDetails();
  }, [unitId]);

  useEffect(() => {
    if (!unitId) {
      setUnitDetails(null);
      setSelectedInsurance(null);
      setTenantInfo(null);
    }
  }, [unitId]);

  const handleCompanySelect = (selectedCompany) => {
    if (!selectedCompany?._id) return;
    setUnitDetails(null);
    setSelectedInsurance(null);
    setTenantInfo(null);
    navigate(`/rental/${selectedCompany._id}`);
  };

  const handleFacilitySelect = (facility) => {
    if (!facility?._id) return;
    setStepIndex(1);
    setUnitDetails(null);
    setSelectedInsurance(null);
    setTenantInfo(null);
  };

  const handleUnitSelect = (unit) => {
    if (!unit?._id) return;
    setStepIndex(2);
    console.log(stepIndex);
    setSelectedInsurance(null);
    setTenantInfo(null);
  };

  const handleContactInfoSubmit = (data) => {
    setTenantInfo(data);
    setStepIndex(4);
  };

  const handleCheckout = async () => {
    const unit = unitDetails?.unit;
    if (!unit?._id) {
      toast.error("Select a unit before starting checkout");
      return;
    }
    if (!tenantInfo?.email) {
      toast.error("Provide a renter email before paying");
      return;
    }

    try {
      setIsLaunchingCheckout(true);
      const metadata = {
        ...(selectedInsurance?._id
          ? { insurancePlanId: selectedInsurance._id }
          : {}),
        ...(selectedInsurance?.name
          ? { insurancePlanName: selectedInsurance.name }
          : {}),
        ...(tenantInfo?.phone ? { tenantPhone: tenantInfo.phone } : {}),
      };
      const currentUrl = window.location.href;
      const payload = {
        unitId: unit._id,
        tenantEmail: tenantInfo.email,
        tenantName:
          [tenantInfo.firstName, tenantInfo.lastName]
            .filter(Boolean)
            .join(" ") || undefined,
        successUrl: currentUrl,
        cancelUrl: currentUrl,
        metadata,
      };

      const { data } = await axios.post(
        "/payments/unit-checkout-session",
        payload,
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Stripe checkout URL was not provided");
      }
    } catch (err) {
      console.error("Failed to start checkout:", err);
      const message =
        err?.response?.data?.message || "Failed to start checkout";
      toast.error(message);
    } finally {
      setIsLaunchingCheckout(false);
    }
  };

  const steps = [
    {
      title: "Select a Company",
      content: (
        <RentalStepCompany
          companies={companies}
          selectedCompanyId={companyId}
          isLoading={companiesLoading}
          onSelectCompany={handleCompanySelect}
        />
      ),
    },
    {
      title: "Select a Location",
      content: (
        <RentalStepOne
          onNext={() => setStepIndex(1)}
          onSelectFacility={handleFacilitySelect}
          facilities={facilities}
        />
      ),
    },
    {
      title: "Select a Unit",
      content: (
        <RentalStepTwo
          onNext={() => setStepIndex(2)}
          onBack={() => setStepIndex(0)}
          onSelectUnit={handleUnitSelect}
          units={units}
        />
      ),
    },
    {
      title: "Customize Your Unit",
      content: (
        <RentalStepThree
          onNext={() => setStepIndex(3)}
          onBack={() => setStepIndex(1)}
          selectedInsurance={selectedInsurance}
          onSelectInsurance={setSelectedInsurance}
          onDetailsLoaded={setUnitDetails}
          unit={unitDetails}
          facility={facility}
        />
      ),
    },
    {
      title: "Additional Information",
      content: (
        <RentalStepFour
          onNext={handleContactInfoSubmit}
          onBack={() => setStepIndex(2)}
        />
      ),
    },
    {
      title: "Review & Pay",
      content: (
        <RentalStepFive
          company={company}
          facility={facility}
          unit={unitDetails}
          selectedInsurance={selectedInsurance}
          tenantInfo={tenantInfo}
          onBack={() => setStepIndex(3)}
          onCheckout={handleCheckout}
          isSubmitting={isLaunchingCheckout}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl p-5">
      <div className="mb-6 flex items-center gap-3">
        {company?.logo && (
          <img
            src={company.logo}
            alt={`${company?.companyName ?? "Selected"} logo`}
            className="max-h-10"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">
            {company?.companyName || "Choose a company to begin"}
          </h1>
          {facility && (
            <p>
              {facility?.address?.street1},
              {facility?.address?.street2 && ` ${facility?.address?.street2},`}{" "}
              {facility?.address?.city}, {facility?.address?.state},{" "}
              {facility?.address?.zipCode}
            </p>
          )}
        </div>
      </div>

      {steps
        .filter((_, index) => !(companyId && index === 0))
        .map((step, index) => {
          // Adjust stepIndex and maxStep since the first step is hidden
          const actualIndex = index;
          return (
            <div key={step.title} className="flex flex-col border">
              <button
                type="button"
                className={`flex items-start justify-between gap-2 px-3 py-2 text-left cursor-default ${
                  stepIndex === actualIndex
                    ? "bg-zinc-600 text-white"
                    : "text-zinc-500"
                }`}
              >
                <span className="font-semibold">{actualIndex + 1}.</span>
                <span>{step.title}</span>
              </button>
              {stepIndex === actualIndex && step.content}
            </div>
          );
        })}
    </div>
  );
}
