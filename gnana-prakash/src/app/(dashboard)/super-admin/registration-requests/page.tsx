import { Metadata } from "next";
import RegistrationRequestsClient from "@/components/users/RegistrationRequestsClient";
import TopBar from "@/components/shared/TopBar";

export const metadata: Metadata = {
  title: "Registration Requests | Super Admin",
};

export default function RegistrationRequestsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Registration Requests" subtitle="Review, approve, or reject new user account registrations." />
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <RegistrationRequestsClient />
      </div>
    </div>
  );
}
