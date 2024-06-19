import axios from "axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function TenantPage({ facilityId }) {
  const [facility, setFacility] = useState(facilityId);

  useEffect(() => {
    setFacility(facilityId);
  }, [facilityId]);

  return (
    <>
      <div className="container mx-auto px-4 mb-5">
        <table className="min-w-full table-auto bg-background-100">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-950 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-950 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-950 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-950 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-950 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white"></tbody>
        </table>
      </div>
    </>
  );
}
