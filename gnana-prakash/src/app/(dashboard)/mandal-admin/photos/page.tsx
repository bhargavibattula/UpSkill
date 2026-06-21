import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import PhotosClient from "@/components/media/PhotosClient";
export const metadata: Metadata = { title: "Photos" };
export default function MandalPhotosPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Photos" subtitle="Upload venue and program photos" />
      <div className="p-4 sm:p-6 lg:p-8"><PhotosClient /></div>
    </div>
  );
}
