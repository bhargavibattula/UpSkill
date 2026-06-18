import { Metadata } from "next";
import AnnouncementsListClient from "@/components/announcements/AnnouncementsListClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Official Circulars | Gnana Prakash",
};

export default function PublicCircularsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-800">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="bg-[#00418C] h-1.5 w-full"></div>
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#00418C] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
          <div>
            <h1 className="text-lg font-black text-[#00418C] tracking-tight uppercase">Gnana Prakash</h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 py-8">
        <AnnouncementsListClient />
      </main>
    </div>
  );
}
