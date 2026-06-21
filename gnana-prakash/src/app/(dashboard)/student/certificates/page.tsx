import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
export const metadata: Metadata = { title: "My Certificates" };
export default function TeacherCertificatesPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Certificates" subtitle="Your earned training certificates" />
      <div className="p-4 md:p-6 space-y-4">
        {[
          { program: "School Leadership & Management Training 2024", date: "14 Jun 2024", id: "CERT-2024-001" },
          { program: "Digital Tools for Education", date: "22 Mar 2024", id: "CERT-2024-002" },
          { program: "FLN Master Trainer Workshop", date: "10 Jan 2024", id: "CERT-2024-003" },
        ].map(cert => (
          <Card key={cert.id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{cert.program}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Issued: {cert.date} · {cert.id}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                <Download className="w-3.5 h-3.5" /> Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
