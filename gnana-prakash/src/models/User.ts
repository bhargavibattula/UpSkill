import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserDoc extends Document {
  employeeId: string;
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: string;
  district?: mongoose.Types.ObjectId;
  mandal?: mongoose.Types.ObjectId;
  venue?: mongoose.Types.ObjectId;
  designation?: string;
  department?: string;
  isActive: boolean;
  avatar?: string;
  lastLogin?: Date;
  resetPasswordOTP?: string;
  resetPasswordOTPExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDoc>({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false, minlength: 8 },
  mobile: { type: String, required: true },
  role: { type: String, enum: ["SUPER_ADMIN","STATE_ADMIN","DISTRICT_ADMIN","MANDAL_ADMIN","VENUE_ADMIN","TEACHER","TRAINER","STAFF","STUDENT"], required: true },
  district: { type: Schema.Types.ObjectId, ref: "District" },
  mandal: { type: Schema.Types.ObjectId, ref: "Mandal" },
  venue: { type: Schema.Types.ObjectId, ref: "Venue" },
  designation: { type: String },
  department: { type: String },
  isActive: { type: Boolean, default: true },
  avatar: { type: String },
  lastLogin: { type: Date },
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date },
}, { timestamps: true });

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

UserSchema.index({ role: 1, isActive: 1 });

if (mongoose.models.User) {
  delete (mongoose.models as any).User;
}
export default mongoose.models.User || mongoose.model<IUserDoc>("User", UserSchema);
