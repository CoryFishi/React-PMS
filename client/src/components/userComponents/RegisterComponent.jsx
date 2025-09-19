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

  const registerUser = async (e) => {
    console.log(userId);
    e.preventDefault();
    var password = "";
    if (passwords.password1 !== passwords.password2) {
      return toast.error("Passwords do not match!");
    } else if (passwords.password1 === "" || passwords.password2 === "") {
      return toast.error("Password can't be blank!");
    }
    password = passwords.password2;
    try {
      const response = await axios.put(`/users/confirm/${userId}`, {
        password,
      });
      toast.success("Registration Successful. Welcome!");
      navigate("/login");
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.error);
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
              onChange={(e) =>
                setPasswords({ ...passwords, password1: e.target.value })
              }
              className="block w-full px-3 py-3 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
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
            onChange={(e) =>
              setPasswords({ ...passwords, password2: e.target.value })
            }
            className="block w-full px-3 py-3 border dark:bg-slate-800 dark:border-slate-700 border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-sky-500 text-white py-2 px-4 rounded-md hover:bg-sky-600 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50"
        >
          Register
        </button>
      </form>
    </div>
  );
}
