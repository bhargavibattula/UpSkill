import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
export const metadata: Metadata = { title: "Feedback" };
export default function TrainerFeedbackPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Feedback" subtitle="Participant feedback on your sessions" />
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader><CardTitle className="text-base">Session Feedback Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-amber-500">4.8</p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= 4 ? "fill-amber-400 text-amber-400" : "text-amber-300"}`} />)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average Rating</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">Detailed feedback will appear after program completion.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
