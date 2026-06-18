import mongoose, { Schema } from "mongoose";

const AuditLogSchema = new Schema({
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  role: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  module: { type: String, required: true, index: true },
  description: { type: String, required: true },
  entityId: { type: String, index: true },
  entityType: { type: String },
  ipAddress: { type: String },
  deviceInfo: { type: String },
  oldValues: { type: Schema.Types.Mixed, default: {} },
  newValues: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
}, { 
  collection: "audit_logs", 
  timestamps: false 
});

AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
