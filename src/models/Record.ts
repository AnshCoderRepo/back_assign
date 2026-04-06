import mongoose, { Schema, Document } from 'mongoose';

export interface IRecord extends Document {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date;
  description?: string;
  isDeleted?: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RecordSchema: Schema = new Schema(
  {
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    type: { type: String, required: true, enum: ['INCOME', 'EXPENSE'] },
    category: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform(_, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

RecordSchema.index({ date: -1 });
RecordSchema.index({ type: 1, category: 1 });
RecordSchema.index({ isDeleted: 1 });
RecordSchema.index({ createdBy: 1 });

export default mongoose.models.Record || mongoose.model<IRecord>('Record', RecordSchema);
