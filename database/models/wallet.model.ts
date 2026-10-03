import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface WalletDoc extends Document {
    userId: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

const WalletSchema = new Schema<WalletDoc>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        balance: { type: Number, required: true, default: 100000, min: 0 },
    },
    { timestamps: true }
);

export const Wallet: Model<WalletDoc> =
    (models?.Wallet as Model<WalletDoc>) || model<WalletDoc>('Wallet', WalletSchema);
