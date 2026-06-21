import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import ProgramsClient from "@/components/programs/ProgramsClient";
export const metadata: Metadata = { title: "Programs" };
export default function MandalProgramsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Programs" subtitle="Manage your venue programs" />
      <div className="p-4 sm:p-6 lg:p-8"><ProgramsClient /></div>
    </div>
  );
}
