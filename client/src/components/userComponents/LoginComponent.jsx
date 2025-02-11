import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
const API_KEY = import.meta.env.VITE_API_KEY;

export default function LoginComponent() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [passwordEye, setPasswordEye] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();
    const { email, password } = data;
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
      } else {
        console.log(data);
        navigate("/dashboard");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.error);
    }
  };

  const handlePasswordClick = () => {
    setPasswordEye(!passwordEye);
  };

  return (
    <div className="min-w-96 mx-auto p-5 bg-white rounded-lg shadow-md shadow-gray-0 dark:bg-darkPrimary dark:border-border border">
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
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className="mt-1 block w-full px-3 py-3 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
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
              onChange={(e) => setData({ ...data, password: e.target.value })}
              className="block w-full px-3 py-3 border dark:bg-darkSecondary dark:border-border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-auto cursor-pointer hover:text-blue-500">
              {passwordEye === false ? (
                <AiFillEyeInvisible onClick={handlePasswordClick} />
              ) : (
                <AiFillEye onClick={handlePasswordClick} />
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        >
          Login
        </button>
      </form>
    </div>
  );
}
