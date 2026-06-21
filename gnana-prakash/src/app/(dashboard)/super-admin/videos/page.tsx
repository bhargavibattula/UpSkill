import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import VideosClient from "@/components/media/VideosClient";
export const metadata: Metadata = { title: "Videos" };
export default function VideosPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Video Management" subtitle="Upload and approve videos" />
      <div className="p-4 sm:p-6 lg:p-8"><VideosClient /></div>
    </div>
  );
}
