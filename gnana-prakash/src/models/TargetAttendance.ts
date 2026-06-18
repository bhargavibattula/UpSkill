import mongoose, { Schema } from "mongoose";

const TargetAttendanceSchema = new Schema({
  title: { type: String, required: true, trim: true },
  target: { type: Number, required: true, min: 0 },
  attended: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.models.TargetAttendance || mongoose.model("TargetAttendance", TargetAttendanceSchema);
