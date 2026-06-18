import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema({
  program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
  date: { type: Date, required: true },
  dayNumber: { type: Number, required: true },
  sgt: { type: Number, default: 0 },
  krp: { type: Number, default: 0 },
  drp: { type: Number, default: 0 },
  deoStaff: { type: Number, default: 0 },
  ssStaff: { type: Number, default: 0 },
  meo: { type: Number, default: 0 },
  hm: { type: Number, default: 0 },
  crp: { type: Number, default: 0 },
  others: { type: Number, default: 0 },
  totalAttendance: { type: Number, default: 0 },
  attendancePercentage: { type: Number, default: 0 },
  amoSignatureImage: { type: String },
  remarks: { type: String },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

AttendanceSchema.index({ program: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
