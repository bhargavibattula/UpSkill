import mongoose, { Schema } from "mongoose";

if (mongoose.models && mongoose.models.Photo) {
  delete (mongoose.models as any).Photo;
}

const PhotoSchema = new Schema({
  image: { type: String, required: true }, // Store Cloudinary URL here
  imagePublicId: { type: String }, // Store Cloudinary public ID for deletion
  url: { type: String }, // Backward compatibility fallback field
  program: { type: Schema.Types.ObjectId, ref: "Program", index: true }, // Corresponding program reference
  programName: { type: String, required: true }, // Store program name directly as requested
  description: { type: String },
  category: {
    type: String,
    enum: [
      "Food Distribution",
      "Inauguration",
      "Classes",
      "Residency Programs",
      "Workshops",
      "Events",
      "Awareness Programs",
      "Training Programs",
      "Other Activities"
    ],
    required: true,
  },
  platform: { type: String, default: "Gnana Prakash" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  uploadDate: { type: Date, default: Date.now },
  approvalDate: { type: Date },
  eventDate: { type: Date },
  additionalNotes: { type: String },
  rejectionReason: { type: String }, // Optional reason provided by Super Admin when rejecting
  
  // Legacy fields fallback compatibility
  title: { type: String },
  filename: { type: String },
  originalName: { type: String },
  size: { type: Number }
}, { timestamps: true });

PhotoSchema.index({ status: 1 });
PhotoSchema.index({ category: 1 });

export default mongoose.models.Photo || mongoose.model("Photo", PhotoSchema);
