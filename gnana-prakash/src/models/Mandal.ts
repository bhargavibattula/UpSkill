import mongoose, { Schema, Document } from "mongoose";

export interface IMandalDoc extends Document {
  name: string;
  code: string;
  district: mongoose.Types.ObjectId;
  isActive: boolean;
}

const MandalSchema = new Schema<IMandalDoc>({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true },
  district: { type: Schema.Types.ObjectId, ref: "District", required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

MandalSchema.index({ district: 1, isActive: 1 });

export default mongoose.models.Mandal || mongoose.model<IMandalDoc>("Mandal", MandalSchema);
