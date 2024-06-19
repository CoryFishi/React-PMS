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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Register</h2>
      <form onSubmit={registerUser}>
        <div className="mb-4 relative">
          <label
            htmlFor="password1"
            className="block text-gray-700 font-semibold"
          >
            Password
          </label>
          <input
            id="password1"
            type={passwordEye === false ? "password" : "text"}
            placeholder="Enter password..."
            value={passwords.password1}
            onChange={(e) =>
              setPasswords({ ...passwords, password1: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
          <div className="absolute bottom-1 right-3 pointer-events-auto cursor-pointer hover:text-blue-500">
            {passwordEye === false ? (
              <AiFillEyeInvisible
                onClick={() => setPasswordEye(!passwordEye)}
              />
            ) : (
              <AiFillEye onClick={() => setPasswordEye(!passwordEye)} />
            )}
          </div>
        </div>
        <div className="mb-4 relative">
          <label
            htmlFor="password2"
            className="block text-gray-700 font-semibold"
          >
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        >
          Register
        </button>
      </form>
    </div>
  );
}
