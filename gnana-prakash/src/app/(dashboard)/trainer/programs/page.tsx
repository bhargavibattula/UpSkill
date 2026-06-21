import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import ProgramsClient from "@/components/programs/ProgramsClient";
export const metadata: Metadata = { title: "Assigned Programs" };
export default function TrainerProgramsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Assigned Programs" subtitle="Programs you are conducting" />
      <div className="p-4 sm:p-6 lg:p-8"><ProgramsClient /></div>
    </div>
  );
}
