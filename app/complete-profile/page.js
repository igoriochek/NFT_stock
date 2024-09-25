'use client'
import React from "react";
import ProfileCompletionForm from "../components/ProfileCompletionForm";
import { useSearchParams } from "next/navigation"; // For retrieving query parameters

const CompleteProfile = () => {
  const searchParams = useSearchParams();
  const address = searchParams.get('address'); // Retrieve the address from query params

  if (!address) {
    return <div className="text-center text-red-500">Error: No MetaMask address found.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <ProfileCompletionForm address={address} />
    </div>
  );
};

export default CompleteProfile;
