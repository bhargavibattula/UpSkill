import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import PhotosClient from "@/components/media/PhotosClient";
export const metadata: Metadata = { title: "Media Approval" };
export default function DistrictMediaPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Media Approval" subtitle="Review and approve uploaded media" />
      <div className="p-4 sm:p-6 lg:p-8"><PhotosClient /></div>
    </div>
  );
}
