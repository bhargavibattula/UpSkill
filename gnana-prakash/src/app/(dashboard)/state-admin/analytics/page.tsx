import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import AnalyticsClient from "@/components/reports/AnalyticsClient";
export const metadata: Metadata = { title: "State Analytics" };
export default function StateAnalyticsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Analytics" subtitle="State education statistics" />
      <div className="p-4 sm:p-6 lg:p-8"><AnalyticsClient /></div>
    </div>
  );
}
