import mongoose from 'mongoose';
import dns from 'dns';

try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    // DNS setServers may throw if called in unsupported environments
}

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if (!MONGODB_URI) throw new Error('MONGODB_URI must be set within .env');

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false, maxPoolSize: 10 });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    console.log(`Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);

    return cached.conn;
}
