import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function LoginComponent() {
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [passwordEye, setPasswordEye] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = ({ email, password }) => {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    return next;
  };

  const loginUser = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const { email, password } = data;
    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        "/login",
        {
          email,
          password,
        },
        {
          headers: {
            "x-api-key": API_KEY,
          },
        }
      );
      if (data.error) {
        toast.error(data.error);
        setSubmitting(false);
      } else {
        toast.success("Login successful!");
        window.location.reload();
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.error || "Login failed.");
      setSubmitting(false);
    }
  };

  const handlePasswordClick = () => {
    setPasswordEye(!passwordEye);
  };

  return (
    <div className="min-w-96 mx-auto p-5 bg-white rounded-lg shadow-md shadow-slate-0 dark:bg-slate-800 dark:border-slate-700 border">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      <form onSubmit={loginUser}>
        {/* Email Section */}
        <div className="mb-2">
          <label htmlFor="email" className="block font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter email..."
            value={data.email}
            onChange={(e) => {
              setData({ ...data, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            aria-invalid={!!errors.email}
            className={`mt-1 block w-full px-3 py-3 border dark:bg-slate-800 rounded-md shadow-sm focus:outline-none sm:text-sm ${
              errors.email
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "dark:border-slate-700 border-slate-300 focus:ring-sky-500 focus:border-sky-500"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
        {/* Password Section */}
        <div className="mb-4">
          <label htmlFor="password" className="block font-semibold">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={passwordEye === false ? "password" : "text"}
              placeholder="Enter password..."
              value={data.password}
              onChange={(e) => {
                setData({ ...data, password: e.target.value });
                if (errors.password)
                  setErrors({ ...errors, password: undefined });
              }}
              aria-invalid={!!errors.password}
              className={`block w-full px-3 py-3 border dark:bg-slate-800 rounded-md shadow-sm focus:outline-none sm:text-sm ${
                errors.password
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "dark:border-slate-700 border-slate-300 focus:ring-sky-500 focus:border-sky-500"
              }`}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-auto cursor-pointer hover:text-sky-500">
              {passwordEye === false ? (
                <AiFillEyeInvisible onClick={handlePasswordClick} />
              ) : (
                <AiFillEye onClick={handlePasswordClick} />
              )}
            </div>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 focus:outline-none focus:ring focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
      <p className="text-sm text-slate-600 dark:text-slate-200 mt-4 max-w-96">
        This website is currently using a shared hosting service provider.
        Please allow up to 2 minutes for the initial api calls to through. You
        may have to reattempt login/register again to retry the process.
      </p>
    </div>
  );
}
