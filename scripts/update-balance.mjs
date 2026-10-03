
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://hemitgadhiya_db_user:iT5YX64TckSpQkCB@cluster0.bszs4p1.mongodb.net/?appName=Cluster0';

async function updateBalance() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const WalletSchema = new mongoose.Schema({
            userId: String,
            balance: Number
        });

        const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);

        // Update all wallets to 100,000
        const result = await Wallet.updateMany({}, { $set: { balance: 100000 } });
        console.log(`Updated ${result.modifiedCount} wallets.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error updating balance:', error);
    }
}

updateBalance();
