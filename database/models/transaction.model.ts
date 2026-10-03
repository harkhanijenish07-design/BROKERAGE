import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface TransactionCharges {
    brokerage: number;
    exchangeCharges: number;
    stampDuty: number;
    ipftCharges: number;
    sebiFees: number;
    stt: number;
    gst: number;
    totalCharges: number;
}

export interface TransactionItem extends Document {
    userId: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    charges: TransactionCharges;
    date: Date;
}

const ChargesSchema = new Schema<TransactionCharges>(
    {
        brokerage: { type: Number, default: 0 },
        exchangeCharges: { type: Number, default: 0 },
        stampDuty: { type: Number, default: 0 },
        ipftCharges: { type: Number, default: 0 },
        sebiFees: { type: Number, default: 0 },
        stt: { type: Number, default: 0 },
        gst: { type: Number, default: 0 },
        totalCharges: { type: Number, default: 0 },
    },
    { _id: false },
);

const TransactionSchema = new Schema<TransactionItem>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, uppercase: true, trim: true },
        type: { type: String, required: true, enum: ['BUY', 'SELL'] },
        quantity: { type: Number, required: true, min: 0.000001 },
        price: { type: Number, required: true, min: 0 },
        charges: { type: ChargesSchema, default: () => ({}) },
        date: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

export const Transaction: Model<TransactionItem> =
    (models?.Transaction as Model<TransactionItem>) || model<TransactionItem>('Transaction', TransactionSchema);
