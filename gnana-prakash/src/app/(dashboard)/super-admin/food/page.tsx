import { Metadata } from "next";
import TopBar from "@/components/shared/TopBar";
import FoodClient from "@/components/food/FoodClient";
export const metadata: Metadata = { title: "Food Records" };
export default function FoodPage() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Food Records" subtitle="Meal tracking and statistics" />
      <div className="p-4 sm:p-6 lg:p-8"><FoodClient /></div>
    </div>
  );
}
