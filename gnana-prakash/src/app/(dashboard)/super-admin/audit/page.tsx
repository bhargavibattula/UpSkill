import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import AuditClient from "@/components/shared/AuditClient";
export const metadata: Metadata = { title: "Audit Logs" };
export default function AuditPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Audit Logs" subtitle="System activity trail" />
      <div className="p-4 sm:p-6 lg:p-8"><AuditClient /></div>
    </div>
  );
}
