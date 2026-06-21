import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import ReportsClient from "@/components/reports/ReportsClient";
export const metadata: Metadata = { title: "Reports" };
export default function StateReportsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Reports" subtitle="State-level report generation" />
      <div className="p-4 sm:p-6 lg:p-8"><ReportsClient /></div>
    </div>
  );
}
