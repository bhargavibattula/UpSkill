"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { programSchema, ProgramInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/hooks/use-toast";

import { useQuery } from "@tanstack/react-query";

const DEPARTMENTS = ["School Education", "Higher Education", "Technical Education", "Training & Planning", "SSA", "RMSA"];

interface ProgramFormProps {
  defaultValues?: Record<string, unknown>;
  onSuccess?: () => void;
}

export default function ProgramForm({ defaultValues, onSuccess }: ProgramFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cleanDefaultValues = defaultValues ? {
    ...defaultValues,
    district: Array.isArray(defaultValues.district)
      ? defaultValues.district.map((d: any) => typeof d === "object" ? d?._id : d)
      : defaultValues.district
        ? [typeof defaultValues.district === "object" ? (defaultValues.district as any)?._id : defaultValues.district]
        : [],
    mandal: Array.isArray(defaultValues.mandal)
      ? defaultValues.mandal.map((m: any) => typeof m === "object" ? m?._id : m)
      : defaultValues.mandal
        ? [typeof defaultValues.mandal === "object" ? (defaultValues.mandal as any)?._id : defaultValues.mandal]
        : [],
    venue: Array.isArray(defaultValues.venue)
      ? defaultValues.venue.map((v: any) => typeof v === "object" ? v?._id : v)
      : defaultValues.venue
        ? [typeof defaultValues.venue === "object" ? (defaultValues.venue as any)?._id : defaultValues.venue]
        : [],
    projectCoordinator: defaultValues.projectCoordinator || "",
    venueIncharge: defaultValues.venueIncharge || "",
    startDate: defaultValues.startDate ? new Date(defaultValues.startDate as string).toISOString().split('T')[0] : "",
    endDate: defaultValues.endDate ? new Date(defaultValues.endDate as string).toISOString().split('T')[0] : "",
  } : undefined;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: (cleanDefaultValues || { district: [], mandal: [], venue: [], projectCoordinator: "", venueIncharge: "" }) as ProgramInput,
  });

  const rawDistricts = watch("district") || [];
  const selectedDistricts = (Array.isArray(rawDistricts) ? rawDistricts : [rawDistricts].filter(Boolean)) as string[];

  const rawMandals = watch("mandal") || [];
  const selectedMandals = (Array.isArray(rawMandals) ? rawMandals : [rawMandals].filter(Boolean)) as string[];

  const rawVenues = watch("venue") || [];
  const selectedVenues = (Array.isArray(rawVenues) ? rawVenues : [rawVenues].filter(Boolean)) as string[];

  const handleDistrictChange = (districtId: string) => {
    const current = Array.isArray(selectedDistricts) ? selectedDistricts : [selectedDistricts].filter(Boolean);
    const updated = current.includes(districtId)
      ? current.filter((id: string) => id !== districtId)
      : [...current, districtId];
    setValue("district", updated, { shouldValidate: true, shouldDirty: true });
    setValue("mandal", [], { shouldValidate: true });
    setValue("venue", [], { shouldValidate: true });
  };

  const handleMandalChange = (mandalId: string) => {
    const current = Array.isArray(selectedMandals) ? selectedMandals : [selectedMandals].filter(Boolean);
    const updated = current.includes(mandalId)
      ? current.filter((id: string) => id !== mandalId)
      : [...current, mandalId];
    setValue("mandal", updated, { shouldValidate: true, shouldDirty: true });
    setValue("venue", [], { shouldValidate: true });
  };

  const handleVenueChange = (venueId: string) => {
    const current = Array.isArray(selectedVenues) ? selectedVenues : [selectedVenues].filter(Boolean);
    const updated = current.includes(venueId)
      ? current.filter((id: string) => id !== venueId)
      : [...current, venueId];
    setValue("venue", updated, { shouldValidate: true, shouldDirty: true });
  };

  const { data: districts } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => { const res = await fetch("/api/districts"); return res.json(); }
  });

  const { data: mandals, isLoading: isLoadingMandals } = useQuery({
    queryKey: ["mandals", selectedDistricts],
    queryFn: async () => { 
      if (selectedDistricts.length === 0) return [];
      const res = await fetch(`/api/mandals?district=${selectedDistricts.join(",")}`); 
      return res.json(); 
    },
    enabled: selectedDistricts.length > 0
  });

  const { data: venues, isLoading: isLoadingVenues } = useQuery({
    queryKey: ["venues", selectedMandals],
    queryFn: async () => { 
      if (selectedMandals.length === 0) return { data: [] };
      const res = await fetch(`/api/venues?mandal=${selectedMandals.join(",")}&limit=100`); 
      return res.json(); 
    },
    enabled: selectedMandals.length > 0
  });

  const onSubmit = async (data: ProgramInput) => {
    setLoading(true);
    setError("");
    try {
      const url = defaultValues?._id ? `/api/programs/${defaultValues._id}` : "/api/programs";
      const method = defaultValues?._id ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json();
        const errMsg = err.error || "Failed to save program";
        setError(errMsg);
        toast({ title: "Save Failed", description: errMsg, variant: "destructive" });
        return;
      }
      toast({ title: defaultValues?._id ? "Program Updated" : "Program Created", description: `The program has been ${defaultValues?._id ? "updated" : "created"} successfully.`, variant: "success" });
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
      toast({ title: "Network Error", description: "Could not connect to the server.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Program Name *</Label>
          <Input placeholder="e.g. School Leadership Training 2024" {...register("programName")} />
          {errors.programName && <p className="text-destructive text-xs">{errors.programName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Training Year *</Label>
          <Input placeholder="2024-25" {...register("trainingYear")} />
          {errors.trainingYear && <p className="text-destructive text-xs">{errors.trainingYear.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Department *</Label>
          <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" {...register("department")}>
            <option value="">Select Department</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.department && <p className="text-destructive text-xs">{errors.department.message}</p>}
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Districts * (Select one or more)</Label>
          {districts && districts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-card/50">
              {districts.map((d: any) => {
                const isChecked = selectedDistricts.includes(d._id);
                return (
                  <label key={d._id} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 hover:bg-accent rounded-md transition-colors">
                    <input
                      type="checkbox"
                      value={d._id}
                      checked={isChecked}
                      onChange={() => handleDistrictChange(d._id)}
                      className="rounded border-input text-primary focus:ring-ring"
                    />
                    <span className="truncate font-medium" title={d.name}>{d.name}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm py-2">Loading districts...</div>
          )}
          {errors.district && <p className="text-destructive text-xs">{errors.district.message}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Mandals * (Select one or more)</Label>
          {isLoadingMandals ? (
            <div className="text-muted-foreground text-sm flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading mandals...
            </div>
          ) : selectedDistricts.length === 0 ? (
            <div className="text-muted-foreground text-sm py-2">Please select at least one District first</div>
          ) : !mandals || mandals.length === 0 ? (
            <div className="text-muted-foreground text-sm py-2">No mandals found for selected districts</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-card/50">
              {mandals.map((m: any) => {
                const isChecked = selectedMandals.includes(m._id);
                return (
                  <label key={m._id} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 hover:bg-accent rounded-md transition-colors">
                    <input
                      type="checkbox"
                      value={m._id}
                      checked={isChecked}
                      onChange={() => handleMandalChange(m._id)}
                      className="rounded border-input text-primary focus:ring-ring"
                    />
                    <span className="truncate font-medium" title={m.name}>{m.name}</span>
                  </label>
                );
              })}
            </div>
          )}
          {errors.mandal && <p className="text-destructive text-xs">{errors.mandal.message}</p>}
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Venues * (Select one or more)</Label>
          {isLoadingVenues ? (
            <div className="text-muted-foreground text-sm flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading venues...
            </div>
          ) : selectedMandals.length === 0 ? (
            <div className="text-muted-foreground text-sm py-2">Please select at least one Mandal first</div>
          ) : !venues?.data || venues.data.length === 0 ? (
            <div className="text-muted-foreground text-sm py-2">No venues found for selected mandals</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-card/50">
              {venues.data.map((v: any) => {
                const isChecked = selectedVenues.includes(v._id);
                return (
                  <label key={v._id} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 hover:bg-accent rounded-md transition-colors">
                    <input
                      type="checkbox"
                      value={v._id}
                      checked={isChecked}
                      onChange={() => handleVenueChange(v._id)}
                      className="rounded border-input text-primary focus:ring-ring"
                    />
                    <span className="truncate font-medium" title={v.name}>{v.name}</span>
                  </label>
                );
              })}
            </div>
          )}
          {errors.venue && <p className="text-destructive text-xs">{errors.venue.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Service Provider</Label>
          <Input placeholder="Organization name" {...register("serviceProvider")} />
        </div>
        <div className="space-y-1.5">
          <Label>Project Coordinator *</Label>
          <Input placeholder="Project Coordinator Name" {...register("projectCoordinator")} />
          {errors.projectCoordinator && <p className="text-destructive text-xs">{errors.projectCoordinator.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Venue Incharge Person *</Label>
          <Input placeholder="Venue Incharge Name" {...register("venueIncharge")} />
          {errors.venueIncharge && <p className="text-destructive text-xs">{errors.venueIncharge.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Start Date *</Label>
          <Input type="date" {...register("startDate")} />
          {errors.startDate && <p className="text-destructive text-xs">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>End Date *</Label>
          <Input type="date" {...register("endDate")} />
          {errors.endDate && <p className="text-destructive text-xs">{errors.endDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" {...register("status")}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Expected Participants</Label>
          <Input type="number" min="0" {...register("expectedParticipants", { valueAsNumber: true })} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Description</Label>
          <textarea className="flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Program description..." {...register("description")} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {defaultValues?._id ? "Update Program" : "Create Program"}
        </Button>
      </div>
    </form>
  );
}
