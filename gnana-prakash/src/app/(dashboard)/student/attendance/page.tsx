import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export const metadata: Metadata = { title: "My Attendance" };
export default function TeacherAttendancePage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Attendance History" subtitle="Your training attendance record" />
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Days", value: "25" },
                { label: "Present", value: "23" },
                { label: "Attendance %", value: "92%" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border p-4 text-center">
                  <p className="text-2xl font-bold text-brand-600">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">Detailed attendance history will appear once you are enrolled in active programs.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
