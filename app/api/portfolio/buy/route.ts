import { auth } from '@clerk/nextjs/server';
import { buyStock } from '@/lib/actions/portfolio.actions';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { symbol, companyName, quantity, price } = body;

        if (!symbol || !quantity || !price || !companyName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await buyStock(userId, symbol, companyName, quantity, price);

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
    } catch (error) {
        console.error('API Portfolio BUY Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
