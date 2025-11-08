import { Schema, model, Document } from 'mongoose';

export interface IStation extends Document {
  name: string;
  regionId: Schema.Types.ObjectId;
}

const StationSchema = new Schema<IStation>({
  name: { type: String, required: true },
  regionId: { type: Schema.Types.ObjectId, ref: 'Region', required: true }
});

export default model<IStation>('Station', StationSchema);
