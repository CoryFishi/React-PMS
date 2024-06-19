import LoginComponent from "../components/userComponents/LoginComponent";
import Navbar from "../components/Navbar";

export default function Login() {
  return (
    <div className="bg-background-50 h-screen">
      <Navbar />
      <LoginComponent />
    </div>
  );
}
