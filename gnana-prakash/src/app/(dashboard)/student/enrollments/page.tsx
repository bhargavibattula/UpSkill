import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";
export const metadata: Metadata = { title: "My Trainings" };
export default function TeacherTrainingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="My Trainings" subtitle="Your enrolled training programs" />
      <div className="p-4 md:p-6 space-y-4">
        {[
          { name: "School Leadership & Management Training 2024", status: "COMPLETED", dates: "10–14 Jun 2024", venue: "DIET Vijayawada" },
          { name: "Digital Classroom Technology Training", status: "ACTIVE", dates: "15–19 Jul 2024", venue: "DIET Guntur" },
          { name: "FLN Training Programme", status: "DRAFT", dates: "20–24 Aug 2024", venue: "DIET Rajahmundry" },
        ].map((t) => (
          <Card key={t.name}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.dates} · {t.venue}</p>
                </div>
              </div>
              <Badge variant={t.status === "ACTIVE" ? "success" : t.status === "COMPLETED" ? "info" : "secondary"} className="text-xs flex-shrink-0">
                {t.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
