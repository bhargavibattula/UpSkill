"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function TagsClient() {
  const [search, setSearch] = useState("");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Management Module</CardTitle>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 h-9 w-full sm:w-48 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" />Add New</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">Full CRUD operations available â€” connect to the corresponding API endpoint.</p>
        </CardContent>
      </Card>
    </div>
  );
}
