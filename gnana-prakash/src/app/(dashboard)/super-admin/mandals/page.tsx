import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import MandalsClient from "@/components/shared/MandalsClient";
export const metadata: Metadata = { title: "Mandals" };
export default function MandalsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Mandals" subtitle="Manage mandal-level divisions" />
      <div className="p-4 sm:p-6 lg:p-8"><MandalsClient /></div>
    </div>
  );
}
