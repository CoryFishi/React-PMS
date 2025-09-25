import { useEffect, useState } from "react";

const usStates = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const defaultFormData = {
  firstName: "",
  middleInitial: "",
  lastName: "",
  businessName: "",
  phone: "",
  smsOptIn: false,
  additionalPhone: "",
  address1: "",
  address2: "",
  city: "",
  country: "US",
  state: "",
  postalCode: "",
  licenseNumber: "",
  dateOfBirth: "",
  licenseExpire: "",
  licenseState: "",
  isMilitary: false,
  email: "",
  confirmEmail: "",
  username: "",
  recoveryQuestion1: "",
  recoveryAnswer1: "",
  recoveryQuestion2: "",
  recoveryAnswer2: "",
  password: "",
  confirmPassword: "",
  gateCode: "",
};

export default function RentalStepFour({ onNext, onBack, initialData }) {
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-6 px-3 py-2 md:grid-cols-2"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          Enter Your Contact Information
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            required
            className="flex-1 rounded border px-2 py-1"
          />
          <input
            name="middleInitial"
            value={formData.middleInitial}
            onChange={handleChange}
            placeholder="MI"
            maxLength={1}
            className="w-12 rounded border px-2 py-1"
          />
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
            className="flex-1 rounded border px-2 py-1"
          />
        </div>
        <input
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          placeholder="Business Name (optional)"
          className="w-full rounded border px-2 py-1"
        />
        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone #"
          required
          className="w-full rounded border px-2 py-1"
        />
        <label className="flex items-center text-sm">
          <input
            name="smsOptIn"
            type="checkbox"
            checked={formData.smsOptIn}
            onChange={handleChange}
            className="mr-2"
          />
          I agree to receive text message communications from this facility
        </label>
        <p className="text-xs text-gray-500">
          By subscribing, you agree to receive communications via text message
          at the phone number provided. Reply STOP to cancel. Message rates may
          apply.
        </p>
        <input
          name="additionalPhone"
          value={formData.additionalPhone}
          onChange={handleChange}
          placeholder="Additional Phone # (optional)"
          className="w-full rounded border px-2 py-1"
        />
        <input
          name="address1"
          value={formData.address1}
          onChange={handleChange}
          placeholder="Address Line 1"
          required
          className="w-full rounded border px-2 py-1"
        />
        <input
          name="address2"
          value={formData.address2}
          onChange={handleChange}
          placeholder="Address Line 2"
          className="w-full rounded border px-2 py-1"
        />
        <div className="flex flex-wrap gap-2">
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            required
            className="rounded border px-2 py-1"
          />
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="rounded border px-2 py-1"
          >
            <option value="" disabled>
              State
            </option>
            {usStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <input
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="Postal Code"
            required
            className="rounded border px-2 py-1"
          />
        </div>
        <input
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleChange}
          placeholder="Driver's License Number"
          className="w-full rounded border px-2 py-1"
        />
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            placeholder="Date of Birth"
            className="rounded border px-2 py-1"
          />
          <input
            type="date"
            name="licenseExpire"
            value={formData.licenseExpire}
            onChange={handleChange}
            placeholder="License Expiration"
            className="rounded border px-2 py-1"
          />
          <input
            name="licenseState"
            value={formData.licenseState}
            onChange={handleChange}
            placeholder="License State"
            className="rounded border px-2 py-1"
          />
        </div>
        <label className="flex items-center text-sm">
          <input
            name="isMilitary"
            type="checkbox"
            checked={formData.isMilitary}
            onChange={handleChange}
            className="mr-2"
          />
          I am an active military service member
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Account Information</h2>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="w-full rounded border px-2 py-1"
        />
        <input
          type="email"
          name="confirmEmail"
          value={formData.confirmEmail}
          onChange={handleChange}
          placeholder="Confirm Email"
          required
          className="w-full rounded border px-2 py-1"
        />
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          className="w-full rounded border px-2 py-1"
        />
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full rounded border px-2 py-1"
        />
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          className="w-full rounded border px-2 py-1"
        />
        <textarea
          name="gateCode"
          value={formData.gateCode}
          onChange={handleChange}
          placeholder="Desired Gate Code"
          className="h-24 w-full rounded border px-2 py-1"
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <input
              name="recoveryQuestion1"
              value={formData.recoveryQuestion1}
              onChange={handleChange}
              placeholder="Recovery Question 1"
              className="w-full rounded border px-2 py-1"
            />
            <input
              name="recoveryAnswer1"
              value={formData.recoveryAnswer1}
              onChange={handleChange}
              placeholder="Answer"
              className="w-full rounded border px-2 py-1"
            />
          </div>
          <div className="flex flex-col gap-2">
            <input
              name="recoveryQuestion2"
              value={formData.recoveryQuestion2}
              onChange={handleChange}
              placeholder="Recovery Question 2"
              className="w-full rounded border px-2 py-1"
            />
            <input
              name="recoveryAnswer2"
              value={formData.recoveryAnswer2}
              onChange={handleChange}
              placeholder="Answer"
              className="w-full rounded border px-2 py-1"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded bg-gray-300 px-4 py-2 text-sm font-semibold"
          >
            Back
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      </div>
    </form>
  );
}
