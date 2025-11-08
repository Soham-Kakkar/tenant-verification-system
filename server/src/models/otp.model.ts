import { Schema, model, Document } from 'mongoose';

export interface IOtp extends Document {
  phone: string;
  code: string;
  verificationRequestId?: Schema.Types.ObjectId;
  expiresAt: Date;
  attempts: number;
}

const OtpSchema = new Schema<IOtp>({
  phone: { type: String, required: true, index: true },
  code: { type: String, required: true },
  verificationRequestId: { type: Schema.Types.ObjectId, ref: 'Verification' },
  expiresAt: Date,
  attempts: { type: Number, default: 0 }
});

export default model<IOtp>('Otp', OtpSchema);
