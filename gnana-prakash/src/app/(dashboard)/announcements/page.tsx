import { Metadata } from "next";
import AnnouncementsListClient from "@/components/announcements/AnnouncementsListClient";
import TopBar from "@/components/shared/TopBar";

export const metadata: Metadata = {
  title: "Official Circulars | Gnana Prakash",
};

export default function PublicCircularsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Official Circulars" subtitle="State Directives and Announcements" />
      <div className="p-6 max-w-7xl mx-auto w-full">
        <AnnouncementsListClient />
      </div>
    </div>
  );
}
