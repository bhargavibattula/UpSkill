import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import PhotosClient from "@/components/media/PhotosClient";
export const metadata: Metadata = { title: "Photos" };
export default function PhotosPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Photo Management" subtitle="Upload and approve photos" />
      <div className="p-4 sm:p-6 lg:p-8"><PhotosClient /></div>
    </div>
  );
}
