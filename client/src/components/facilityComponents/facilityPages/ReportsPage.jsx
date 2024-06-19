import axios from "axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ReportsPage({ facilityId }) {
  const [facility, setFacility] = useState(facilityId);

  useEffect(() => {
    setFacility(facilityId);
  }, [facilityId]);

  return (
    <>

    </>
  );
}
