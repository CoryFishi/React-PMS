import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";

export default function RegisterComponent() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    password1: "",
    password2: "",
  });
  const [passwordEye, setPasswordEye] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const registerUser = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const next = {};
    if (!passwords.password1) next.password1 = "Password can't be blank.";
    else if (passwords.password1.length < 8)
      next.password1 = "Password must be at least 8 characters.";
    if (passwords.password1 !== passwords.password2)
      next.password2 = "Passwords do not match.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await axios.put(`/users/confirm/${userId}`, {
        password: passwords.password2,
      });
      toast.success("Registration Successful. Welcome!");
      navigate("/login");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.error || "Registration failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-96 mx-auto p-5 bg-white rounded-lg shadow-md shadow-slate-0 dark:bg-slate-800 dark:border-slate-700 border">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      <form onSubmit={registerUser}>
        <div className="mb-2">
          <label htmlFor="password" className="block font-semibold">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password1"
              type={passwordEye === false ? "password" : "text"}
              placeholder="Enter password..."
              value={passwords.password1}
              onChange={(e) => {
                setPasswords({ ...passwords, password1: e.target.value });
                if (errors.password1)
                  setErrors({ ...errors, password1: undefined });
              }}
              aria-invalid={!!errors.password1}
              className={`block w-full px-3 py-3 border dark:bg-slate-800 rounded-md shadow-sm focus:outline-none sm:text-sm ${
                errors.password1
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "dark:border-slate-700 border-slate-300 focus:ring-sky-500 focus:border-sky-500"
              }`}
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-auto cursor-pointer hover:text-sky-500">
              {passwordEye === false ? (
                <AiFillEyeInvisible
                  onClick={() => setPasswordEye(!passwordEye)}
                />
              ) : (
                <AiFillEye onClick={() => setPasswordEye(!passwordEye)} />
              )}
            </div>
          </div>
          {errors.password1 && (
            <p className="mt-1 text-sm text-red-500">{errors.password1}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="password2" className="block font-semibold">
            Confirm Password
          </label>
          <input
            id="password2"
            type="password"
            placeholder="Confirm password..."
            value={passwords.password2}
            onChange={(e) => {
              setPasswords({ ...passwords, password2: e.target.value });
              if (errors.password2)
                setErrors({ ...errors, password2: undefined });
            }}
            aria-invalid={!!errors.password2}
            className={`block w-full px-3 py-3 border dark:bg-slate-800 rounded-md shadow-sm focus:outline-none sm:text-sm ${
              errors.password2
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "dark:border-slate-700 border-slate-300 focus:ring-sky-500 focus:border-sky-500"
            }`}
          />
          {errors.password2 && (
            <p className="mt-1 text-sm text-red-500">{errors.password2}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
