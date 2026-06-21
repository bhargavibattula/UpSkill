import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import VenuesClient from "@/components/venues/VenuesClient";
export const metadata: Metadata = { title: "District Venues" };
export default function DistrictVenuesPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Venues" subtitle="Training centers in your district" />
      <div className="p-4 sm:p-6 lg:p-8"><VenuesClient /></div>
    </div>
  );
}
