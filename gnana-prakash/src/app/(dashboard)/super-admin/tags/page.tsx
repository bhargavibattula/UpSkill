import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import TagsClient from "@/components/shared/TagsClient";
export const metadata: Metadata = { title: "Tag Management" };
export default function TagsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Tags" subtitle="Manage classification tags" />
      <div className="p-4 sm:p-6 lg:p-8"><TagsClient /></div>
    </div>
  );
}
