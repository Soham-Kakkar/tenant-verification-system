import { Schema, model, Document } from 'mongoose';

export enum VerificationStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  ASSIGNED = 'assigned',
  VERIFIED = 'verified',
  FLAGGED = 'flagged'
}

export interface IVerification extends Document {
  landlordName: string;
  landlordPhone: string;
  tenantName: string;
  tenantPhone?: string;
  fatherName?: string;
  aadharNumber?: string;
  purposeOfStay?: string;
  previousAddress?: string;
  tenantPhoto?: { url: string; filename: string; size: number }[];
  aadharPhoto?: { url: string; filename: string; size: number }[];
  familyPhoto?: { url: string; filename: string; size: number }[];
  tenantIdDocs?: { url: string; filename: string }[];
  address?: string;
  stationId: Schema.Types.ObjectId;
  regionId: Schema.Types.ObjectId;
  status: VerificationStatus;
  otpCode?: string;
  otpExpiresAt?: Date;
  otpVerifiedAt?: Date;
  assignedTo?: Schema.Types.ObjectId;
  assignedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt?: Date;
  history: {
    actionBy: Schema.Types.ObjectId;
    action: string;
    comment?: string;
    at: Date;
  }[];
}

const VerificationSchema = new Schema<IVerification>({
  landlordName: { type: String, required: true },
  landlordPhone: { type: String, required: true },
  tenantName: { type: String, required: true },
  tenantPhone: String,
  fatherName: String,
  aadharNumber: String,
  purposeOfStay: String,
  previousAddress: String,
  tenantPhoto: [{ url: String, filename: String, size: Number }],
  aadharPhoto: [{ url: String, filename: String, size: Number }],
  familyPhoto: [{ url: String, filename: String, size: Number }],
  tenantIdDocs: [{ url: String, filename: String }],
  address: String,
  stationId: { type: Schema.Types.ObjectId, ref: 'Station', required: true },
  regionId: { type: Schema.Types.ObjectId, ref: 'Region', required: true },
  status: { type: String, enum: Object.values(VerificationStatus), default: VerificationStatus.PENDING },
  otpCode: String,
  otpExpiresAt: Date,
  otpVerifiedAt: Date,
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  history: [{
    actionBy: { type: Schema.Types.ObjectId, ref: 'User' },
    action: String,
    comment: String,
    at: Date
  }]
});

VerificationSchema.index({ stationId: 1, status: 1 });

export default model<IVerification>('Verification', VerificationSchema);
