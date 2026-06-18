import mongoose from "mongoose";

export interface IAnnouncement extends mongoose.Document {
  title: string;
  description: string;
  priority: "URGENT" | "MANDATORY" | "UPDATE" | "INFO";
  createdBy: mongoose.Types.ObjectId;
  expiryDate?: Date;
  imageUrl?: string;
  imagePublicId?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { 
      type: String, 
      enum: ["URGENT", "MANDATORY", "UPDATE", "INFO"], 
      default: "INFO",
      required: true 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiryDate: { type: Date },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Announcement = mongoose.models.Announcement || mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
