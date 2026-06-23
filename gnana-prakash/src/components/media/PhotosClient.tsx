"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload, Image as ImageIcon, Check, X, Loader2, Filter,
  Search, SlidersHorizontal, Calendar, User, Building, Trash2,
  CheckCircle, AlertTriangle, Edit3, ArrowUpDown, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, PHOTO_CATEGORIES } from "@/lib/utils";
import imageCompression from 'browser-image-compression';

interface SessionUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string;
}

export default function PhotosClient() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<"gallery" | "upload" | "approvals">("gallery");

  // Gallery view controls
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [selectedPhoto, setSelectedPhoto] = useState<Record<string, any> | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  // Toast notifications state
  interface ToastItem {
    id: string;
    title: string;
    description?: string;
    type: "success" | "error" | "info";
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (title: string, type: "success" | "error" | "info" = "info", description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  // Upload Form controls
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState(PHOTO_CATEGORIES[0] || "Other Activities");
  const [uploadProgramId, setUploadProgramId] = useState("");
  const [uploadPlatform, setUploadPlatform] = useState("Gnana Prakash");
  const [uploadEventDate, setUploadEventDate] = useState("");
  const [uploadAdditionalNotes, setUploadAdditionalNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");

  // Approval panel controls
  const [approvalRemarks, setApprovalRemarks] = useState<Record<string, string>>({});

  // Metadata Edit Form controls
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPlatform, setEditPlatform] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editAdditionalNotes, setEditAdditionalNotes] = useState("");
  const [editProgramId, setEditProgramId] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // Fetch session
  useEffect(() => {
    fetch("/api/auth/custom-session")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          qc.invalidateQueries({ queryKey: ["programs_list_media"] });
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userRole = user?.role || "STUDENT";
  const userEmail = user?.email || "";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // Admins & Teachers can submit upload requests, Super Admin uploads directly.
  const isAllowedToUpload = ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "MANDAL_ADMIN", "VENUE_ADMIN", "TEACHER"].includes(userRole);

  // Fetch programs for select dropdown (handles scoping at the API level based on user role)
  const { data: programsData, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["programs_list_media", userRole],
    queryFn: async () => {
      const res = await fetch("/api/programs?limit=100&bypassScope=true");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    enabled: !!userRole && userRole !== "STUDENT",
  });

  const programsOptions = programsData?.data || [];

  console.log("DEBUG PHOTOSCLIENT DROPDOWN:", {
    userRole,
    userEmail,
    programsData,
    programsOptions,
    isAllowedToUpload
  });

  // Fetch Photos based on search, category, sort, and permissions
  const { data: approvedPhotos, isLoading: isLoadingApproved } = useQuery({
    queryKey: ["photos_approved", searchQuery, categoryFilter, platformFilter, programFilter, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "Approved", limit: "48", sort: sortOrder });
      if (searchQuery) params.set("search", searchQuery);
      if (categoryFilter && categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (platformFilter && platformFilter !== "ALL") params.set("platform", platformFilter);
      if (programFilter && programFilter !== "ALL") params.set("program", programFilter);

      const res = await fetch(`/api/photos?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    }
  });

  // Fetch Pending/Rejected Photos (Super Admin only)
  const { data: pendingPhotos, isLoading: isLoadingPending } = useQuery({
    queryKey: ["photos_pending"],
    queryFn: async () => {
      const res = await fetch("/api/photos?status=Pending&limit=100");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    enabled: isSuperAdmin,
  });

  const { data: rejectedPhotos, isLoading: isLoadingRejected } = useQuery({
    queryKey: ["photos_rejected"],
    queryFn: async () => {
      const res = await fetch("/api/photos?status=Rejected&limit=100");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    },
    enabled: isSuperAdmin,
  });

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Image size exceeds the 10MB limit.");
        return;
      }
      setSelectedFile(file);
      setUploadError("");

      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Upload Form
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select an image file to upload.");
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError("Please enter an image title.");
      return;
    }
    if (!uploadProgramId) {
      setUploadError("Please associate this image with a training program.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadSuccessMessage("");

    try {
      // Compress the image before uploading to avoid Vercel's 4.5MB request body limit
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(selectedFile, options);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("title", uploadTitle);
      formData.append("description", uploadDescription);
      formData.append("category", uploadCategory);
      formData.append("program", uploadProgramId);
      formData.append("platform", uploadPlatform);
      if (uploadEventDate) formData.append("eventDate", uploadEventDate);
      formData.append("additionalNotes", uploadAdditionalNotes);

      const res = await fetch("/api/photos", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const resData = await res.json();
      setUploadSuccessMessage(resData.message || "Upload submitted successfully.");
      showToast(
        "Upload Successful",
        "success",
        isSuperAdmin
          ? "Photo uploaded successfully."
          : "Your image upload request has been submitted for approval."
      );

      // Clear inputs
      setUploadTitle("");
      setUploadDescription("");
      setUploadAdditionalNotes("");
      setUploadEventDate("");
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      qc.invalidateQueries({ queryKey: ["photos_approved"] });
      if (isSuperAdmin) qc.invalidateQueries({ queryKey: ["photos_pending"] });
    } catch (err: any) {
      const errMsg = err.message || "Something went wrong.";
      setUploadError(errMsg);
      showToast("Upload Failed", "error", errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Approve / Reject Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ id, action, remarks }: { id: string; action: "approve" | "reject"; remarks?: string }) => {
      const res = await fetch(`/api/photos/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks: remarks || "" })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Approval action failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["photos_approved"] });
      qc.invalidateQueries({ queryKey: ["photos_pending"] });
      qc.invalidateQueries({ queryKey: ["photos_rejected"] });
      showToast("Status Updated", "success", data.message || "The photo status has been updated successfully.");
    },
    onError: (err: any) => {
      showToast("Action Failed", "error", err.message || "Could not update the photo status.");
    }
  });

  // Delete Photo Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/photos/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["photos_approved"] });
      qc.invalidateQueries({ queryKey: ["photos_pending"] });
      qc.invalidateQueries({ queryKey: ["photos_rejected"] });
      setSelectedPhoto(null);
      showToast("Image Deleted", "success", "The photo has been permanently deleted from the gallery.");
    },
    onError: (err: any) => {
      showToast("Delete Failed", "error", err.message || "Could not delete the photo.");
    }
  });

  // Edit Metadata Mode
  const startEditing = () => {
    if (!selectedPhoto) return;
    setEditTitle(selectedPhoto.title || selectedPhoto.filename || "");
    setEditDescription(selectedPhoto.description || "");
    setEditCategory(selectedPhoto.category || PHOTO_CATEGORIES[0]);
    setEditPlatform(selectedPhoto.platform || "Gnana Prakash");
    setEditEventDate(selectedPhoto.eventDate ? selectedPhoto.eventDate.split("T")[0] : "");
    setEditAdditionalNotes(selectedPhoto.additionalNotes || "");
    setEditProgramId(selectedPhoto.program?._id || selectedPhoto.program || "");
    setIsEditing(true);
  };

  const saveMetadataEdit = async () => {
    if (!selectedPhoto) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/photos/${selectedPhoto._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          platform: editPlatform,
          eventDate: editEventDate || null,
          additionalNotes: editAdditionalNotes,
          programId: editProgramId
        })
      });

      if (!res.ok) throw new Error("Failed to save changes");
      const updated = await res.json();
      setSelectedPhoto(updated.data);
      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ["photos_approved"] });
      showToast("Metadata Updated", "success", "The photo metadata has been updated successfully.");
    } catch (err: any) {
      showToast("Update Failed", "error", err.message || "Could not update the photo metadata.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const platformsList = ["Gnana Prakash", "School Education", "SS Office", "DEO Office"];

  return (
    <div className="space-y-6">
      {/* Tabs Selection */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-50/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("gallery")}
          className={`flex-grow sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "gallery"
              ? "bg-white shadow-sm border border-slate-100 text-brand-600"
              : "text-slate-500 hover:text-slate-800"
            }`}
        >
          <ImageIcon className="w-4 h-4" /> Approved Gallery
        </button>

        {isAllowedToUpload && (
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex-grow sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "upload"
                ? "bg-white shadow-sm border border-slate-100 text-brand-600"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex-grow sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all relative ${activeTab === "approvals"
                ? "bg-white shadow-sm border border-slate-100 text-brand-600"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Super Admin Approvals
            {pendingPhotos?.total > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-full text-[11px] flex items-center justify-center font-extrabold shadow-lg shadow-rose-500/40 ring-2 ring-white animate-pulse">
                {pendingPhotos.total}
              </span>
            )}
          </button>
        )}
      </div>

      {/* GALLERY FEED TAB */}
      {activeTab === "gallery" && (
        <div className="space-y-6">
          {/* Filters Card */}
          <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Search Bar */}
                <div className="relative md:col-span-2">
                  <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    placeholder="Search by program, category, description..."
                    className="h-9 pl-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Category */}
                <select className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs focus:outline-none"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {PHOTO_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Filter Program */}
                <select className="flex h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-xs focus:outline-none"
                  value={programFilter}
                  onChange={(e) => setProgramFilter(e.target.value)}
                >
                  <option value="ALL">All Programs</option>
                  {programsOptions.map((prog: any) => (
                    <option key={prog._id} value={prog._id}>
                      {prog.programName}
                    </option>
                  ))}
                </select>

                {/* Sorting */}
                <div className="flex border rounded-md items-center bg-white px-2.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-2" />
                  <select className="h-8 w-full border-0 bg-transparent text-slate-900 dark:text-slate-100 text-xs focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                  >
                    <option value="latest">Latest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid Layout */}
          {isLoadingApproved ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand-600" /></div>
          ) : !approvedPhotos?.data?.length ? (
            <Card className="border-slate-100 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20 text-brand-600" />
                <p className="font-semibold text-slate-700">No Images Available</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                  There are no approved images matching these filters. Selecting a specific program displays all approved images associated with it.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {approvedPhotos.data.map((photo: any) => (
                <div
                  key={photo._id}
                  onClick={() => { setSelectedPhoto(photo); setIsEditing(false); }}
                  className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  <img src={photo.image || photo.url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 text-white">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">{photo.category}</p>
                    <p className="font-semibold text-xs truncate leading-snug">{photo.title || "Image Title"}</p>
                    <p className="text-[9px] text-slate-300 truncate leading-none mt-1">{photo.programName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD REQUEST FORM TAB */}
      {activeTab === "upload" && isAllowedToUpload && (
        <Card className="border-slate-100 shadow-sm max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              {isSuperAdmin ? "Direct Gallery Upload" : "Request Image Upload"}
            </CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? "As Super Admin, your uploads are saved directly and published to the gallery feed immediately."
                : "Submit images for the gallery. Images will remain in Pending state and NOT show to users until approved by Super Admin."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {uploadError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccessMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-colors hover:bg-slate-50/50 flex flex-col items-center justify-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {filePreview ? (
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden border">
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Click to upload or drag & drop</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supported formats: JPG, PNG, WebP up to 10MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Image Title *</Label>
                  <Input
                    placeholder="Enter short title for image"
                    className="h-9 text-xs"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Category *</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                  >
                    {PHOTO_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Program Name *</Label>
                {isLoadingPrograms ? (
                  <div className="flex items-center text-xs text-slate-500 py-2 border rounded-md px-3 bg-slate-50/50">
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 text-brand-600" />
                    Loading training programs...
                  </div>
                ) : programsOptions.length === 0 ? (
                  <div className="text-xs text-rose-500 font-semibold py-2 px-3 bg-rose-50 border border-rose-100 rounded-md">
                    No training programs available. Please create a program first.
                  </div>
                ) : (
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                    value={uploadProgramId}
                    onChange={(e) => setUploadProgramId(e.target.value)}
                  >
                    <option value="">-- Associate with training program --</option>
                    {programsOptions.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.programName}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Platform</Label>
                  <Input
                    placeholder="e.g. Gnana Prakash"
                    className="h-9 text-xs"
                    value={uploadPlatform}
                    onChange={(e) => setUploadPlatform(e.target.value)}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Event Date</Label>
                  <Input
                    type="date"
                    className="h-9 text-xs"
                    value={uploadEventDate}
                    onChange={(e) => setUploadEventDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Program Description</Label>
                <Textarea
                  placeholder="Enter context, workshop topic, or description..."
                  className="text-xs min-h-[70px]"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Additional Notes</Label>
                <Textarea
                  placeholder="Any extra feedback, trainer notes, or remarks..."
                  className="text-xs min-h-[60px]"
                  value={uploadAdditionalNotes}
                  onChange={(e) => setUploadAdditionalNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold h-10 px-8"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  {isSuperAdmin ? "Direct Publish" : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SUPER ADMIN APPROVALS TAB */}
      {activeTab === "approvals" && isSuperAdmin && (
        <div className="space-y-8">
          {/* Pending Reviews */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Reviews ({pendingPhotos?.total || 0})
            </h2>

            {isLoadingPending ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
            ) : !pendingPhotos?.data?.length ? (
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <CheckCircle className="w-10 h-10 mb-2.5 opacity-20 text-emerald-600" />
                  <p className="font-semibold text-slate-700 text-xs">No Pending Requests</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">All image requests have been processed.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-5">
                {pendingPhotos.data.map((photo: any) => (
                  <Card key={photo._id} className="border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="relative h-56 bg-slate-50 border-b border-slate-100">
                      <img src={photo.image || photo.url} alt={photo.title} className="w-full h-full object-contain" />
                      <Badge className="absolute top-3 right-3 bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider">
                        Pending Approval
                      </Badge>
                    </div>

                    <CardContent className="p-4.5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div>
                          <Badge variant="outline" className="text-[9px] font-bold text-brand-600 uppercase border-brand-200">
                            {photo.category}
                          </Badge>
                          <h3 className="font-bold text-sm text-slate-900 leading-snug mt-1">{photo.title || "Image File"}</h3>
                          <p className="text-xs text-slate-500 mt-1">{photo.description || "No description provided."}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-slate-50 pt-2.5">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Program Name</p>
                            <p className="font-semibold text-slate-700 truncate">{photo.programName}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Platform</p>
                            <p className="font-semibold text-slate-700 truncate">{photo.platform}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Requested By</p>
                            <p className="font-semibold text-slate-700 truncate">{photo.requestedBy?.name || "User"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Request Date</p>
                            <p className="font-semibold text-slate-700 truncate">{formatDate(photo.uploadDate)}</p>
                          </div>
                        </div>

                        {/* Event Date & Notes */}
                        {(photo.eventDate || photo.additionalNotes) && (
                          <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                            {photo.eventDate && (
                              <p className="text-[10px] text-slate-600">
                                <strong>Event Date:</strong> {formatDate(photo.eventDate)}
                              </p>
                            )}
                            {photo.additionalNotes && (
                              <p className="text-[10px] text-slate-600">
                                <strong>Notes:</strong> {photo.additionalNotes}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-1 pt-1">
                          <Label className="text-[9px] font-bold text-slate-500 uppercase">Rejection Remarks (Required if Rejecting)</Label>
                          <Input
                            placeholder="e.g. Image quality is insufficient."
                            className="h-8 text-xs"
                            value={approvalRemarks[photo._id] || ""}
                            onChange={(e) => setApprovalRemarks(prev => ({
                              ...prev,
                              [photo._id]: e.target.value
                            }))}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3 border-t border-slate-100">
                        <Button
                          size="sm"
                          disabled={actionMutation.isPending}
                          onClick={() => actionMutation.mutate({
                            id: photo._id,
                            action: "approve",
                            remarks: approvalRemarks[photo._id]
                          })}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold h-10 text-sm rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                        </Button>
                        <Button
                          size="sm"
                          disabled={actionMutation.isPending}
                          onClick={() => {
                            if (!approvalRemarks[photo._id]?.trim()) {
                              showToast("Remarks Required", "error", "Please enter a rejection reason in the remarks field before rejecting.");
                              return;
                            }
                            actionMutation.mutate({
                              id: photo._id,
                              action: "reject",
                              remarks: approvalRemarks[photo._id]
                            });
                          }}
                          className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold h-10 text-sm rounded-xl shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-200 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Rejected List (Super Admin visibility) */}
          <div className="space-y-4 pt-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b pb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Rejected Requests ({rejectedPhotos?.total || 0})
            </h2>

            {isLoadingRejected ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
            ) : !rejectedPhotos?.data?.length ? (
              <p className="text-slate-400 text-xs italic">No rejected requests in historical log.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {rejectedPhotos.data.map((photo: any) => (
                  <div
                    key={photo._id}
                    onClick={() => { setSelectedPhoto(photo); setIsEditing(false); }}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square cursor-pointer hover:shadow"
                  >
                    <img src={photo.image || photo.url} alt={photo.title} className="w-full h-full object-cover grayscale opacity-70" />
                    <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-2 text-white">
                      <p className="text-[9px] font-bold text-rose-400 uppercase">Rejected</p>
                      <p className="font-semibold text-[10px] truncate">{photo.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL PREVIEW & METADATA EDIT DIALOG */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border-none p-0 shadow-2xl">
          {selectedPhoto && (
            <div className="flex flex-col md:flex-row h-full">
              {/* Image box */}
              <div className="md:w-[55%] bg-slate-900 flex items-center justify-center min-h-[300px] md:max-h-[500px]">
                <img
                  src={selectedPhoto.image || selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>

              {/* Details Pane */}
              <div className="md:w-[45%] p-6 flex flex-col justify-between space-y-6 bg-white overflow-y-auto max-h-[500px]">
                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-brand-600 text-white font-bold text-[9px] uppercase tracking-wider">
                          {selectedPhoto.category}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] font-bold text-slate-500 border-slate-200">
                          {selectedPhoto.platform}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold ${selectedPhoto.status === "Approved"
                              ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                              : selectedPhoto.status === "Rejected"
                                ? "text-rose-700 border-rose-200 bg-rose-50"
                                : "text-amber-700 border-amber-200 bg-amber-50"
                            }`}
                        >
                          {selectedPhoto.status}
                        </Badge>
                      </div>

                      <DialogTitle className="text-base font-bold text-slate-900 leading-snug">
                        {selectedPhoto.title || selectedPhoto.filename || "Image View"}
                      </DialogTitle>

                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {selectedPhoto.description || "No description provided."}
                      </p>
                    </div>

                    {/* Metadata Table */}
                    <div className="space-y-3.5 border-t border-slate-100 pt-4 text-xs">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Program Link</p>
                        <p className="font-semibold text-slate-700 leading-snug">{selectedPhoto.programName}</p>
                      </div>

                      {selectedPhoto.eventDate && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Event Date</p>
                          <p className="font-semibold text-slate-700">{formatDate(selectedPhoto.eventDate)}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Requested By</p>
                          <p className="font-semibold text-slate-700 truncate">{selectedPhoto.requestedBy?.name || "Anonymous"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Request Date</p>
                          <p className="font-semibold text-slate-700 truncate">{formatDate(selectedPhoto.uploadDate)}</p>
                        </div>
                      </div>

                      {selectedPhoto.status === "Approved" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-2 rounded-lg">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Approved By</p>
                            <p className="font-semibold text-emerald-700 truncate">{selectedPhoto.approvedBy?.name || "Super Admin"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Approval Date</p>
                            <p className="font-semibold text-emerald-700 truncate">{formatDate(selectedPhoto.approvalDate)}</p>
                          </div>
                        </div>
                      )}

                      {selectedPhoto.status === "Rejected" && selectedPhoto.rejectionReason && (
                        <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                          <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Rejection Reason</p>
                          <p className="font-medium text-rose-800 mt-0.5">{selectedPhoto.rejectionReason}</p>
                        </div>
                      )}

                      {selectedPhoto.additionalNotes && (
                        <div className="bg-slate-50 p-2.5 rounded-lg">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Additional Notes</p>
                          <p className="text-slate-600 text-[10px] mt-0.5">{selectedPhoto.additionalNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Metadata Editing and Deletion controls for Super Admin */}
                    {isSuperAdmin && (
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={startEditing}
                          className="text-xs gap-1.5 h-8 font-bold border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit Metadata
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPhotoToDelete(selectedPhoto._id)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold gap-1 text-xs h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Image
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Super Admin Metadata Editor View
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <h3 className="font-bold text-sm text-slate-900">Edit Image Metadata</h3>
                      <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase">Image Title</Label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8.5 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase">Category</Label>
                        <select className="flex h-8.5 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                        >
                          {PHOTO_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase">Program Link</Label>
                        {isLoadingPrograms ? (
                          <div className="flex items-center text-xs text-slate-500 py-1.5 border rounded-md px-3 bg-slate-50/50">
                            <Loader2 className="w-3 h-3 animate-spin mr-2 text-brand-600" />
                            Loading training programs...
                          </div>
                        ) : programsOptions.length === 0 ? (
                          <div className="text-xs text-rose-500 font-semibold py-1.5 px-3 bg-rose-50 border border-rose-100 rounded-md">
                            No training programs available.
                          </div>
                        ) : (
                          <select className="flex h-8.5 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none dark:bg-slate-900 text-slate-900 dark:text-slate-100 dark:border-slate-700"
                            value={editProgramId}
                            onChange={(e) => setEditProgramId(e.target.value)}
                          >
                            <option value="">-- No Association --</option>
                            {programsOptions.map((p: any) => (
                              <option key={p._id} value={p._id}>{p.programName}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-600 uppercase">Platform</Label>
                          <Input
                            value={editPlatform}
                            onChange={(e) => setEditPlatform(e.target.value)}
                            className="h-8.5 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-600 uppercase">Event Date</Label>
                          <Input
                            type="date"
                            value={editEventDate}
                            onChange={(e) => setEditEventDate(e.target.value)}
                            className="h-8.5 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase">Program Description</Label>
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="text-xs min-h-[60px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-600 uppercase">Additional Notes</Label>
                        <Textarea
                          value={editAdditionalNotes}
                          onChange={(e) => setEditAdditionalNotes(e.target.value)}
                          className="text-xs min-h-[50px]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-3 border-t justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="text-xs font-bold"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveMetadataEdit}
                        disabled={isSavingEdit}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold h-8.5 px-5 text-xs"
                      >
                        {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!photoToDelete} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <DialogContent className="max-w-sm rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 text-center">Delete Photo?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <p className="text-center text-sm text-slate-600">
              Are you sure you want to permanently delete this photo from the database? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex gap-3 sm:justify-center mt-2">
            <Button variant="outline" onClick={() => setPhotoToDelete(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (photoToDelete) {
                  deleteMutation.mutate(photoToDelete);
                  setPhotoToDelete(null);
                }
              }}
              className="w-full sm:w-auto"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" style={{ maxWidth: '380px' }}>
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const accentColor = isError ? "#ef4444" : "#22c55e";

          return (
            <div
              key={toast.id}
              className="pointer-events-auto relative bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-[slideDown_0.3s_ease-out]"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {isError ? (
                  <AlertTriangle className="w-6 h-6 flex-shrink-0" fill="#ef4444" stroke="white" />
                ) : (
                  <CheckCircle className="w-6 h-6 flex-shrink-0" fill="#22c55e" stroke="white" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-snug">{toast.title}</p>
                  {toast.description && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="h-[3px] w-full" style={{ backgroundColor: accentColor }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
