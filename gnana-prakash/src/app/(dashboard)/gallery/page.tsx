import { Metadata } from "next";
import { getCustomSession } from "@/lib/auth/session";
import TopBar from "@/components/shared/TopBar";
import PhotosClient from "@/components/media/PhotosClient";

export const metadata: Metadata = { title: "Image Gallery" };

export default async function ImageGalleryPage() {
  const session = await getCustomSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-col min-h-full">
      <TopBar 
        title="Image Gallery" 
        subtitle="View and share training workshop moments" 
        showSearch={!isSuperAdmin}
        showBell={!isSuperAdmin}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        <PhotosClient />
      </div>
    </div>
  );
}
