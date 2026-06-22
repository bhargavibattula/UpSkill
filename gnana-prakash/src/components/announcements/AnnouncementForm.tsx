"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";

interface AnnouncementInput {
  title: string;
  description: string;
  priority: "URGENT" | "MANDATORY" | "UPDATE" | "INFO";
  expiryDate?: string;
  isActive: boolean;
}

interface Props {
  defaultValues?: Record<string, any>;
  onSuccess?: () => void;
}

export default function AnnouncementForm({ defaultValues, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cleanValues = defaultValues ? {
    ...defaultValues,
    expiryDate: defaultValues.expiryDate ? new Date(defaultValues.expiryDate).toISOString().split('T')[0] : "",
  } : {
    priority: "INFO",
    isActive: true,
  };

  const { register, handleSubmit, formState: { errors } } = useForm<AnnouncementInput>({
    defaultValues: cleanValues as any,
  });

  const onSubmit = async (data: AnnouncementInput) => {
    setLoading(true);
    setError("");
    try {
      const url = defaultValues?._id ? `/api/announcements/${defaultValues._id}` : "/api/announcements";
      const method = defaultValues?._id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          expiryDate: data.expiryDate || undefined
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        const errMsg = err.error || "Failed to save circular";
        setError(errMsg);
        toast({ title: "Save Failed", description: errMsg, variant: "destructive" });
        return;
      }
      
      toast({ 
        title: defaultValues?._id ? "Circular Updated" : "Circular Created", 
        description: `The official circular has been successfully ${defaultValues?._id ? "updated" : "created"}.`,
        variant: "success" 
      });
      
      onSuccess?.();
    } catch (err) {
      setError("Network error. Please try again.");
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">{error}</div>}
      
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input placeholder="Enter circular title" {...register("title", { required: "Title is required" })} />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Description *</Label>
        <Textarea 
          placeholder="Enter full circular details..." 
          className="min-h-[120px] resize-none"
          {...register("description", { required: "Description is required" })} 
        />
        {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Priority *</Label>
          <select 
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" 
            {...register("priority", { required: "Priority is required" })}
          >
            <option value="INFO">Info (Sky Blue)</option>
            <option value="UPDATE">Update (Blue)</option>
            <option value="MANDATORY">Mandatory (Yellow)</option>
            <option value="URGENT">Urgent (Red)</option>
          </select>
        </div>
        
        <div className="space-y-1.5">
          <Label>Expiry Date (Optional)</Label>
          <Input type="date" {...register("expiryDate")} />
          <p className="text-[10px] text-muted-foreground">Leave blank if it never expires</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t mt-4">
        <input 
          type="checkbox" 
          id="isActive" 
          {...register("isActive")} 
          className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" 
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          Publish immediately (Active Status)
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {defaultValues?._id ? "Update Circular" : "Publish Circular"}
        </Button>
      </div>
    </form>
  );
}
