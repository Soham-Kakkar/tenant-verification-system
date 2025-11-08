import { Schema, model, Document } from 'mongoose';

export interface IRegion extends Document {
  name: string;
  description?: string;
}

const RegionSchema = new Schema<IRegion>({
  name: { type: String, required: true, unique: true },
  description: String
});

export default model<IRegion>('Region', RegionSchema);
