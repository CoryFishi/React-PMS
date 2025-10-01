import { useState } from "react";
import { BiRightArrow } from "react-icons/bi";

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
  street1: "",
  street2: "",
  city: "",
  country: "US",
  state: "",
  zipCode: "",
  DLNumber: "",
  dateOfBirth: "",
  DLExpire: "",
  DLState: "",
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

const exampleFormData = {
  firstName: "John",
  middleInitial: "Q",
  lastName: "Public",
  businessName: "Acme Corp",
  phone: "555-123-4567",
  smsOptIn: true,
  additionalPhone: "555-987-6543",
  street1: "123 Main St",
  street2: "Apt 4B",
  city: "Springfield",
  country: "US",
  state: "IL",
  zipCode: "62704",
  DLNumber: "D1234567",
  dateOfBirth: "1980-01-01",
  DLExpire: "2030-12-31",
  DLState: "IL",
  isMilitary: true,
  email: "john.public@example.com",
  confirmEmail: "john.public@example.com",
  username: "johnpublic",
  recoveryQuestion1: "Mother's maiden name?",
  recoveryAnswer1: "Smith",
  recoveryQuestion2: "First pet's name?",
  recoveryAnswer2: "Rover",
  password: "Password123!",
  confirmPassword: "Password123!",
  gateCode: "1234",
};

export default function RentalStepFour({ onNext, onBack, companyName }) {
  const [formData, setFormData] = useState(defaultFormData);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(
      isLoginVisible
        ? { username: loginUsername, password: loginPassword }
        : formData,
      isLoginVisible ? "login" : "register"
    );
  };

  return (
    <>
      <div
        className={`w-full flex justify-end px-10 pt-3 items-center font-medium`}
      >
        <div
          className="group inline-flex items-center gap-1 text-sky-600 hover:text-sky-400 duration-300 transition-all hover:gap-3 cursor-pointer hover:underline"
          onClick={() => setIsLoginVisible(!isLoginVisible)}
        >
          <span>
            {isLoginVisible
              ? `Create a new account`
              : `Already rent with ${companyName}? Login here`}
          </span>
          <BiRightArrow />
        </div>
      </div>
      {isLoginVisible ? (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-x-6 px-3 py-2"
        >
          <div className="flex flex-1 flex-col">
            <label htmlFor="loginUsername">Username</label>
            <input
              name="loginUsername"
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Username"
              required
              className="flex-1 rounded border px-2 py-1"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <label htmlFor="password">Password</label>
            <input
              name="password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Password"
              required
              className="flex-1 rounded border px-2 py-1"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="rounded bg-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Back
            </button>
            <button
              type="submit"
              className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              {isLoginVisible ? `Login` : `Register`} & Continue
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-x-6 px-3 py-2 md:grid-cols-2"
        >
          <div className="flex flex-col gap-2">
            <h2
              className="text-lg font-semibold"
              onClick={() => setFormData(exampleFormData)}
            >
              Enter Your Contact Information
            </h2>
            <div className="flex flex-wrap justify-evenly gap-x-2">
              <div className="flex flex-1 flex-col">
                <label htmlFor="firstName">First Name</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  required
                  className="flex-1 rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-1 flex-col min-w-fit">
                <label htmlFor="middleInitial">Middle Initial</label>
                <input
                  name="middleInitial"
                  value={formData.middleInitial}
                  onChange={handleChange}
                  placeholder="MI"
                  maxLength={1}
                  className="w-12 rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-1 flex-col min-w-fit">
                <label htmlFor="lastName">Last Name</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  required
                  className="flex-1 rounded border px-2 py-1"
                />
              </div>
            </div>
            <div className="flex flex-1 flex-col min-w-fit">
              <label htmlFor="businessName">Business Name (optional)</label>
              <input
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Business Name (optional)"
                className="w-full rounded border px-2 py-1"
              />
            </div>
            <div>
              <div className="flex flex-1 flex-col min-w-fit">
                <label htmlFor="phone">Phone #</label>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone #"
                  required
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-1 flex-col min-w-fit">
                <label htmlFor="additionalPhone">Additional Phone #</label>
                <input
                  name="additionalPhone"
                  value={formData.additionalPhone}
                  onChange={handleChange}
                  placeholder="Additional Phone # (optional)"
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <label className="flex items-center text-sm py-1 px-1">
                <input
                  name="smsOptIn"
                  type="checkbox"
                  checked={formData.smsOptIn}
                  onChange={handleChange}
                  className="mr-2"
                  required
                />
                I agree to receive text message communications
              </label>
              <p className="text-xs text-slate-500 px-1">
                By subscribing, you agree to receive communications via text
                message at the phone number provided. Reply STOP to cancel.
                Message rates may apply.
              </p>
            </div>
            <div className="flex flex-1 flex-col min-w-fit">
              <label htmlFor="address1">Address Line 1</label>
              <input
                name="address1"
                value={formData.street1}
                onChange={handleChange}
                placeholder="Address Line 1"
                required
                className="w-full rounded border px-2 py-1"
              />
              <label htmlFor="address2">Address Line 2</label>
              <input
                name="address2"
                value={formData.street2}
                onChange={handleChange}
                placeholder="Address Line 2"
                className="w-full rounded border px-2 py-1"
              />
            </div>
            <div className="flex w-full justify-between gap-2">
              <div className="flex flex-col w-3/12">
                <label htmlFor="city">City</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                  className="rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-col w-2/12">
                <label htmlFor="state">State</label>
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
              </div>
              <div className="flex flex-1 flex-col w-3/12">
                <label htmlFor="postalCode">Postal Code</label>
                <input
                  name="postalCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="Postal Code"
                  required
                  className="rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-col w-3/12">
                <label htmlFor="country">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="rounded border px-2 py-1"
                >
                  <option value="" disabled>
                    Country
                  </option>
                  <option value="US">United States</option>
                </select>
              </div>
            </div>
            <div className="flex flex-1 flex-col">
              <label htmlFor="licenseNumber">Driver's License Number</label>
              <input
                name="licenseNumber"
                value={formData.DLNumber}
                onChange={handleChange}
                placeholder="Driver's License Number"
                required
                className="w-full rounded border px-2 py-1"
              />
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex flex-1 flex-col">
                <label htmlFor="licenseExpire">License Expiration</label>
                <input
                  type="date"
                  name="licenseExpire"
                  value={formData.DLExpire}
                  onChange={handleChange}
                  placeholder="License Expiration"
                  required
                  className="rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <label htmlFor="licenseState">License State</label>
                <select
                  name="licenseState"
                  value={formData.DLState}
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
              </div>
              <div className="flex flex-1 flex-col">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  placeholder="Date of Birth"
                  required
                  className="rounded border px-2 py-1"
                />
              </div>
            </div>
            <label className="flex items-center text-sm px-1">
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
            <div>
              {" "}
              <div className="flex flex-col">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="confirmEmail">Confirm Email Address</label>
                <input
                  type="email"
                  name="confirmEmail"
                  value={formData.confirmEmail}
                  onChange={handleChange}
                  placeholder="Confirm Email"
                  required
                  className="w-full rounded border px-2 py-1"
                />
              </div>
            </div>
            <div>
              {" "}
              <div className="flex flex-col">
                <label htmlFor="username">Username</label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  required
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  required
                  className="w-full rounded border px-2 py-1"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label htmlFor="gateCode">Desired Gate Code</label>
              <input
                name="gateCode"
                type="number"
                value={formData.gateCode}
                onChange={handleChange}
                placeholder="Desired Gate Code"
                required
                className="w-full rounded border px-2 py-1"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col">
                <label htmlFor="recoveryQuestion1">Recovery Question 1</label>
                <input
                  name="recoveryQuestion1"
                  value={formData.recoveryQuestion1}
                  onChange={handleChange}
                  placeholder="Recovery Question 1"
                  required
                  className="w-full rounded border px-2 py-1"
                />
                <label htmlFor="recoveryAnswer1">Recovery Answer 1</label>
                <input
                  name="recoveryAnswer1"
                  value={formData.recoveryAnswer1}
                  onChange={handleChange}
                  placeholder="Answer"
                  required
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="recoveryQuestion2">Recovery Question 2</label>
                <input
                  name="recoveryQuestion2"
                  value={formData.recoveryQuestion2}
                  onChange={handleChange}
                  placeholder="Recovery Question 2"
                  required
                  className="w-full rounded border px-2 py-1"
                />
                <label htmlFor="recoveryAnswer2">Recovery Answer 2</label>
                <input
                  name="recoveryAnswer2"
                  value={formData.recoveryAnswer2}
                  onChange={handleChange}
                  placeholder="Answer"
                  required
                  className="w-full rounded border px-2 py-1"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="rounded bg-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Register & Continue
              </button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
