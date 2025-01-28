import { UserContext } from "../../context/userContext";
import React, { useContext } from "react";

export default function TenantPayment() {
  const { user } = useContext(UserContext);
  return (
    <>
      <Payment data={user} />
    </>
  );
}
