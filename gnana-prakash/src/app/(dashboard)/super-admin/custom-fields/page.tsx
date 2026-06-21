import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import CustomFieldsClient from "@/components/shared/CustomFieldsClient";
export const metadata: Metadata = { title: "Target Attendance" };
export default function CustomFieldsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Target Attendance" subtitle="Configure target attendance and view achievement analytics" />
      <div className="p-4 sm:p-6 lg:p-8"><CustomFieldsClient /></div>
    </div>
  );
}
