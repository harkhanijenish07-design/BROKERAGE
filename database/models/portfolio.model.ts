import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PortfolioItem extends Document {
    userId: string;
    symbol: string;
    companyName: string;
    quantity: number;
    averageBuyPrice: number;
    totalInvested: number;
    createdAt: Date;
    updatedAt: Date;
}

const PortfolioSchema = new Schema<PortfolioItem>(
    {
        userId: { type: String, required: true, index: true },
        symbol: { type: String, required: true, uppercase: true, trim: true },
        companyName: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 0 },
        averageBuyPrice: { type: Number, required: true, min: 0 },
        totalInvested: { type: Number, required: true, min: 0 },
    },
    { timestamps: true }
);

// Unique compound index so a user has only one entry per stock symbol
PortfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Portfolio: Model<PortfolioItem> =
    (models?.Portfolio as Model<PortfolioItem>) || model<PortfolioItem>('Portfolio', PortfolioSchema);
