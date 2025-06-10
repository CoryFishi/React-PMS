import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

export default function RentalStepFour({ onNext, onBack }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
  });

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
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 px-3 py-2">
      {/* LEFT COLUMN */}
      <div className="flex flex-col gap-1 flex-wrap">
        <h2 className="text-lg font-semibold mb-3">
          Enter Your Contact Information
        </h2>

        <div className="flex gap-2 w-full flex-wrap">
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            required
            className="flex-1 border px-2 py-1 rounded"
          />
          <input
            name="middleInitial"
            value={formData.middleInitial}
            onChange={handleChange}
            placeholder="MI"
            maxLength={1}
            className="w-12 border px-2 py-1 rounded"
          />
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
            className="flex-1 border px-2 py-1 rounded"
          />
        </div>
        <input
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          placeholder="Business Name (optional)"
          className="w-full border px-2 py-1 rounded"
        />
        <input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone #"
          required
          className="w-full border px-2 py-1 rounded"
        />

        <label className="flex items-center text-sm w-full">
          <input
            name="smsOptIn"
            type="checkbox"
            checked={formData.smsOptIn}
            onChange={handleChange}
            className="mr-2"
          />
          I agree to receive text message communications from this facility
        </label>
        <p className="text-xs text-gray-500 w-full">
          By subscribing, you agree to receive communications via text message
          at the phone number provided. Reply STOP to cancel. Message rates may
          apply.
        </p>
        <input
          name="additionalPhone"
          value={formData.additionalPhone}
          onChange={handleChange}
          placeholder="Additional Phone # (optional)"
          className="w-full border px-2 py-1 rounded"
        />

        <input
          name="address1"
          value={formData.address1}
          onChange={handleChange}
          placeholder="Address Line 1"
          required
          className="w-full border px-2 py-1 rounded"
        />
        <input
          name="address2"
          value={formData.address2}
          onChange={handleChange}
          placeholder="Address Line 2"
          className="w-full border px-2 py-1 rounded"
        />

        <div className="flex gap-2 w-full flex-wrap">
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            required
            className="border px-2 py-1 rounded"
          />
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="border px-2 py-1 rounded"
          >
            <option value="US">United States</option>
          </select>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="border px-2 py-1 rounded"
          >
            <option value="">State</option>
            {usStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <input
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            placeholder="Postal"
            required
            className="border px-2 py-1 rounded"
          />
        </div>

        <h3 className="font-semibold mt-4 mb-3">
          Driver's License Information
        </h3>
        <input
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleChange}
          placeholder="License #"
          required
          className="w-full border px-2 py-1 rounded"
        />
        <div className="flex gap-2">
          <input
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="flex-1 border px-2 py-1 rounded"
          />
          <input
            name="licenseExpire"
            type="date"
            value={formData.licenseExpire}
            onChange={handleChange}
            required
            className="flex-1 border px-2 py-1 rounded"
          />
        </div>
        <select
          name="licenseState"
          value={formData.licenseState}
          onChange={handleChange}
          required
          className="w-full border px-2 py-1 rounded"
        >
          <option value="">State</option>
          {usStates.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <label className="flex items-center text-sm">
          <input
            name="isMilitary"
            type="checkbox"
            checked={formData.isMilitary}
            onChange={handleChange}
            className="mr-2"
          />
          Check here if you are Military
        </label>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col gap-1 flex-wrap">
        <h2 className="text-lg font-semibold mb-3">Create an Account</h2>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="w-full border px-2 py-1 rounded"
        />
        <input
          name="confirmEmail"
          type="email"
          value={formData.confirmEmail}
          onChange={handleChange}
          placeholder="Confirm Email"
          required
          className="w-full border px-2 py-1 rounded"
        />
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          required
          className="w-full border px-2 py-1 rounded mb-4"
        />

        <h3 className="font-semibold mb-3">
          Enter Password Recovery Questions/Answers
        </h3>
        <input
          name="recoveryQuestion1"
          value={formData.recoveryQuestion1}
          onChange={handleChange}
          placeholder="Question 1"
          required
          className="w-full border px-2 py-1 rounded mb-1"
        />
        <input
          name="recoveryAnswer1"
          value={formData.recoveryAnswer1}
          onChange={handleChange}
          placeholder="Answer"
          required
          className="w-full border px-2 py-1 rounded mb-3"
        />
        <input
          name="recoveryQuestion2"
          value={formData.recoveryQuestion2}
          onChange={handleChange}
          placeholder="Question 2"
          required
          className="w-full border px-2 py-1 rounded mb-1"
        />
        <input
          name="recoveryAnswer2"
          value={formData.recoveryAnswer2}
          onChange={handleChange}
          placeholder="Answer"
          required
          className="w-full border px-2 py-1 rounded mb-4"
        />

        <h3 className="font-semibold mb-3">
          Choose a Password{" "}
          <span className="text-sm">(Minimum 8 characters)</span>
        </h3>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter a Password"
          required
          className="w-full border px-2 py-1 rounded"
        />
        <input
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter Password"
          required
          className="w-full border px-2 py-1 rounded mb-4"
        />

        <h3 className="font-semibold mb-3">
          Choose an Access Code{" "}
          <span className="text-sm">(length 4–10 digits)</span>
        </h3>
        <input
          name="accessCode"
          type="text"
          value={formData.accessCode}
          onChange={handleChange}
          placeholder="Access Code"
          required
          className="w-full border px-2 py-1 rounded"
        />
      </div>

      {/* FOOTER BUTTONS */}
      <div className="col-span-2 flex justify-between mt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-300 text-black rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-400 text-white rounded"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Next
        </button>
      </div>
    </form>
  );
}
