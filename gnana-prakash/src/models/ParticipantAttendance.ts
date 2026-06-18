import mongoose, { Schema } from "mongoose";

const ParticipantAttendanceSchema = new Schema({
  program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
  participant: { type: Schema.Types.ObjectId, ref: "Participant", required: true },
  date: { type: Date, required: true },
  dayNumber: { type: Number, required: true },
  status: { type: String, enum: ["PRESENT", "ABSENT"], default: "ABSENT" },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

// A participant can only have one attendance record per day for a specific program
ParticipantAttendanceSchema.index({ program: 1, participant: 1, dayNumber: 1 }, { unique: true });

export default mongoose.models.ParticipantAttendance || mongoose.model("ParticipantAttendance", ParticipantAttendanceSchema);
