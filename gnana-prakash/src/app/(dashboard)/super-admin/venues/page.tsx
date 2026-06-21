import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import VenuesClient from "@/components/venues/VenuesClient";
export const metadata: Metadata = { title: "Venues" };
export default function VenuesPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Venues" subtitle="Training center management" />
      <div className="p-4 sm:p-6 lg:p-8"><VenuesClient /></div>
    </div>
  );
}
