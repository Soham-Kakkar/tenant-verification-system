import { Schema, model, Document } from 'mongoose';

export enum VerificationStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  ASSIGNED = 'assigned',
  RETURNED = 'returned',
  VERIFIED = 'verified',
  FLAGGED = 'flagged'
}

export interface IVerification extends Document {
  landlordName: string;
  landlordPhone: string;
  tenantName: string;
  tenantPhones?: string[];
  fatherName?: string;
  aadharNumber?: string;
  purposeOfStay?: string;
  previousAddress?: string;
  tenantPhoto?: { data: Buffer; contentType: string; filename: string; size: number }[];
  aadharPhoto?: { data: Buffer; contentType: string; filename: string; size: number }[];
  familyPhoto?: { data: Buffer; contentType: string; filename: string; size: number }[];
  tenantIdDocs?: { data: Buffer; contentType: string; filename: string }[];
  address?: string;
  familyMembers?: number;
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
    actionBy: string;
    action: string;
    comment?: string;
    at: Date;
  }[];
}

const VerificationSchema = new Schema<IVerification>({
  landlordName: { type: String, required: true },
  landlordPhone: { type: String, required: true },
  tenantName: { type: String, required: false },
  tenantPhones: [String],
  fatherName: String,
  aadharNumber: String,
  purposeOfStay: String,
  previousAddress: String,
  familyMembers: Number,
  tenantPhoto: [{
    data: Buffer,
    contentType: String,
    filename: String,
    size: Number
  }],
  aadharPhoto: [{
    data: Buffer,
    contentType: String,
    filename: String,
    size: Number
  }],
  familyPhoto: [{
    data: Buffer,
    contentType: String,
    filename: String,
    size: Number
  }],
  tenantIdDocs: [{
    data: Buffer,
    contentType: String,
    filename: String
  }],
  address: { type: String, required: true },
  stationId: { type: Schema.Types.ObjectId, ref: 'Station', required: false },
  regionId: { type: Schema.Types.ObjectId, ref: 'Region', required: false },
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
