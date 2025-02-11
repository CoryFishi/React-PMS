import { UserContext } from "../../context/userContext";
import React, { useContext } from "react";
import PaymentForm from "../components/paymentComponents/Payment";
import Navbar from "../components/Navbar";

export default function TenantPayment() {
  const { user } = useContext(UserContext);
  return (
    <>
      <Navbar />
      <PaymentForm data={user} />
    </>
  );
}
