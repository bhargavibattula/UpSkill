import mongoose, { Schema } from "mongoose";

const ParticipantSchema = new Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true },
  email: { type: String, lowercase: true },
  schoolName: { type: String },
  designation: { type: String, required: true },
  category: {
    type: String,
    enum: ["SGT","SCHOOL_ASSISTANT","GOVERNMENT_TEACHER","HM","CRP","MEO","KRP","DRP","GUEST_FACULTY","SUBJECT_EXPERT","DEO_STAFF","SS_OFFICE_STAFF","VENUE_STAFF","SUPPORT_STAFF"],
    required: true,
  },
  district: { type: String, required: true },
  mandal: { type: String },
  program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
  isResidential: { type: Boolean, default: false },
  registrationDate: { type: Date, default: Date.now },
  certificateIssued: { type: Boolean, default: false },
  customFields: { type: Map, of: Schema.Types.Mixed },
}, { timestamps: true });

ParticipantSchema.index({ program: 1, category: 1 });

export default mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema);
