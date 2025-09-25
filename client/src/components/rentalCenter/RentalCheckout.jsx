import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import RentalStepCompany from "./steps/RentalStepCompany";
import RentalStepOne from "./steps/RentalStepOne";
import RentalStepTwo from "./steps/RentalStepTwo";
import RentalStepThree from "./steps/RentalStepThree";
import RentalStepFour from "./steps/RentalStepFour";
import RentalStepFive from "./steps/RentalStepFive";
import RentalStepSix from "./steps/RentalStepSix";
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
  const [contactInfo, setContactInfo] = useState(null);
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false);

  const [stepIndex, setStepIndex] = useState(() => {
    if (!companyId) return 0;
    if (!facilityId) return 1;
    if (!unitId) return 2;
    return 3;
  });

  useEffect(() => {
    const loadCompanies = async () => {
      setCompaniesLoading(true);
      try {
        const { data } = await axios.get("/companies", {
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

    loadCompanies();
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
          withCredentials: true,
        });
        document.title = data?.companyName || "Rental Checkout";
        const favicon = document.querySelector("link[rel='icon']");
        if (favicon && data?.logo) {
          favicon.href = data.logo;
        }
        setCompany(data);
      } catch (err) {
        console.error("Error getting company data:", err);
        toast.error("Failed to load company details");
      }
    };

    loadCompanyDetails();
  }, [companyId]);

  useEffect(() => {
    if (!unitId) {
      setUnitDetails(null);
      setSelectedInsurance(null);
      setContactInfo(null);
    }
  }, [unitId]);

  const handleCompanySelect = (selectedCompany) => {
    if (!selectedCompany?._id) return;
    setStepIndex(1);
    setUnitDetails(null);
    setSelectedInsurance(null);
    setContactInfo(null);
    navigate(`/rental/${selectedCompany._id}`);
  };

  const handleFacilitySelect = (facility) => {
    if (!facility?._id) return;
    setUnitDetails(null);
    setSelectedInsurance(null);
    setContactInfo(null);
  };

  const handleUnitSelect = (unit) => {
    if (!unit?._id) return;
    setSelectedInsurance(null);
    setContactInfo(null);
  };

  const handleContactInfoSubmit = (data) => {
    setContactInfo(data);
    setStepIndex(5);
  };

  const handleCheckout = async () => {
    const unit = unitDetails?.unit;
    if (!unit?._id) {
      toast.error("Select a unit before starting checkout");
      return;
    }
    if (!contactInfo?.email) {
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
        ...(contactInfo?.phone ? { tenantPhone: contactInfo.phone } : {}),
      };
      const currentUrl = window.location.href;
      const payload = {
        unitId: unit._id,
        tenantEmail: contactInfo.email,
        tenantName:
          [contactInfo.firstName, contactInfo.lastName]
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

  const maxStep = (() => {
    let max = 0;
    if (companyId) max = 1;
    if (facilityId) max = 2;
    if (unitId) max = 4;
    if (contactInfo) max = 5;
    return max;
  })();

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
          onNext={() => setStepIndex(2)}
          onSelectFacility={handleFacilitySelect}
        />
      ),
    },
    {
      title: "Select a Unit",
      content: (
        <RentalStepTwo
          onNext={() => setStepIndex(3)}
          onBack={() => setStepIndex(1)}
          onSelectUnit={handleUnitSelect}
        />
      ),
    },
    {
      title: "Customize Your Unit",
      content: (
        <RentalStepThree
          onNext={() => setStepIndex(4)}
          onBack={() => setStepIndex(2)}
          selectedInsurance={selectedInsurance}
          onSelectInsurance={setSelectedInsurance}
          onDetailsLoaded={setUnitDetails}
        />
      ),
    },
    {
      title: "Additional Information",
      content: (
        <RentalStepFour
          onNext={handleContactInfoSubmit}
          onBack={() => setStepIndex(3)}
          initialData={contactInfo}
        />
      ),
    },
    {
      title: "Review & Pay",
      content: (
        <RentalStepFive
          company={company}
          facility={unitDetails?.facility}
          unit={unitDetails?.unit}
          selectedInsurance={selectedInsurance}
          contactInfo={contactInfo}
          onBack={() => setStepIndex(4)}
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
          {company?.address && (
            <p className="text-sm text-gray-600">
              {company.address.street1}
              {company.address.street2 ? `, ${company.address.street2}` : ""}
            </p>
          )}
        </div>
      </div>

      {steps.map((step, index) => (
        <div key={step.title} className="flex flex-col border">
          <button
            type="button"
            className={`flex items-start justify-between gap-2 px-3 py-2 text-left ${
              stepIndex === index ? "bg-zinc-600 text-white" : "text-zinc-500"
            } ${index <= maxStep ? "cursor-pointer" : "cursor-not-allowed"}`}
            onClick={() => {
              if (index <= maxStep) {
                setStepIndex(index);
              }
            }}
          >
            <span className="font-semibold">{index + 1}.</span>
            <span>{step.title}</span>
          </button>
          {stepIndex === index && step.content}
        </div>
      ))}
    </div>
  );
}
