import mongoose, { Schema } from "mongoose";

const MealSchema = new Schema({
  quantity: { type: Number, default: 0 },
  participants: { type: Number, default: 0 },
  remarks: { type: String },
  photos: [{ type: String }],
}, { _id: false });

const FoodRecordSchema = new Schema({
  program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
  date: { type: Date, required: true },
  dayNumber: { type: Number, required: true },
  breakfast: { type: MealSchema, default: {} },
  teaBreak: { type: MealSchema, default: {} },
  lunch: { type: MealSchema, default: {} },
  snacks: { type: MealSchema, default: {} },
  dinner: { type: MealSchema, default: {} },
  recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

FoodRecordSchema.index({ program: 1, date: 1 });

export default mongoose.models.FoodRecord || mongoose.model("FoodRecord", FoodRecordSchema);
