import { Metadata } from "next";
import AnnouncementsClient from "@/components/announcements/AnnouncementsClient";

export const metadata: Metadata = {
  title: "Official Circulars | Super Admin",
};

export default function CircularsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Official Circulars</h1>
        <p className="text-muted-foreground text-sm">Create and manage state directives and important announcements.</p>
      </div>

      <AnnouncementsClient />
    </div>
  );
}
