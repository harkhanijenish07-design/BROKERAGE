import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Portfolio } from '../database/models/portfolio.model';
import { getQuote } from '../lib/actions/finnhub.actions';

dotenv.config({ path: '.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI must be set in .env.local');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    const dbStart = Date.now();
    await mongoose.connect(uri);
    console.log(`Connected in ${Date.now() - dbStart}ms`);

    // Find a user with some portfolio items
    const items = await Portfolio.find().limit(5).lean();
    if (items.length === 0) {
      console.log('No portfolio items found in DB.');
    } else {
      const userId = items[0].userId;
      console.log(`Testing with userId: ${userId}`);

      const userItems = await Portfolio.find({ userId }).lean();
      console.log(`User has ${userItems.length} holdings.`);

      console.log('Fetching quotes concurrently...');
      const quoteStart = Date.now();
      const results = await Promise.all(
        userItems.map(async (item) => {
          const start = Date.now();
          const quote = await getQuote(item.symbol);
          return { symbol: item.symbol, time: Date.now() - start, price: quote.currentPrice };
        })
      );
      const totalTime = Date.now() - quoteStart;
      console.log(`Total time for ${userItems.length} quotes: ${totalTime}ms`);
      results.forEach(r => console.log(`  - ${r.symbol}: ${r.time}ms (Price: ${r.price})`));
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

main();
