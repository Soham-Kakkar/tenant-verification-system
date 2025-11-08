import { Schema, model, Document } from 'mongoose';

export enum Role {
  SUPERADMIN = 'superAdmin',
  ADMIN0 = 'admin0',
  ADMIN1 = 'admin1',
  ADMIN2 = 'admin2'
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: Role;
  stationId?: Schema.Types.ObjectId;
  regionId?: Schema.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, sparse: true },
  passwordHash: { type: String },
  googleId: { type: String },
  role: { type: String, enum: Object.values(Role), required: true },
  stationId: { type: Schema.Types.ObjectId, ref: 'Station' },
  regionId: { type: Schema.Types.ObjectId, ref: 'Region' },
  createdAt: { type: Date, default: Date.now }
});

export default model<IUser>('User', UserSchema);
