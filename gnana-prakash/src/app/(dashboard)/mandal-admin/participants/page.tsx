import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import ParticipantsClient from "@/components/participants/ParticipantsClient";
export const metadata: Metadata = { title: "Participants" };
export default function MandalParticipantsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Participants" subtitle="Manage registered participants" />
      <div className="p-4 sm:p-6 lg:p-8"><ParticipantsClient /></div>
    </div>
  );
}
