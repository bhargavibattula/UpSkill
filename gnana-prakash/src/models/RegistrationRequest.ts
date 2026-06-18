import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRegistrationRequest extends Document {
  fullName: string;
  email: string;
  mobileNumber: string;
  requestedRole: string;
  passwordHash: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

const registrationRequestSchema = new Schema<IRegistrationRequest>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobileNumber: { type: String, required: true },
    requestedRole: { type: String, required: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

// Prevent re-registering if already approved or pending
registrationRequestSchema.index({ email: 1 }, { unique: true });

export const RegistrationRequest: Model<IRegistrationRequest> = 
  mongoose.models.RegistrationRequest || mongoose.model<IRegistrationRequest>("RegistrationRequest", registrationRequestSchema);
