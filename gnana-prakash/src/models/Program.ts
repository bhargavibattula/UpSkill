import mongoose, { Schema } from "mongoose";

const ProgramSchema = new Schema({
  programName: { type: String, required: true, trim: true },
  trainingYear: { type: String, required: true },
  department: { type: String, required: true },
  district: [{ type: Schema.Types.ObjectId, ref: "District", index: true }],
  mandal: [{ type: Schema.Types.ObjectId, ref: "Mandal" }],
  venue: [{ type: Schema.Types.ObjectId, ref: "Venue" }],
  serviceProvider: { type: String },
  projectCoordinator: { type: String },
  venueIncharge: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["DRAFT","ACTIVE","COMPLETED","CANCELLED"], default: "DRAFT" },
  description: { type: String },
  expectedParticipants: { type: Number, default: 0 },
  totalDays: { type: Number, default: 1 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tags: [{ type: String }],
  customFields: { type: Map, of: Schema.Types.Mixed },
}, { timestamps: true });

ProgramSchema.index({ status: 1, district: 1 });
ProgramSchema.index({ startDate: 1, endDate: 1 });

if (mongoose.models.Program) {
  delete mongoose.models.Program;
}
export default mongoose.models.Program || mongoose.model("Program", ProgramSchema);
