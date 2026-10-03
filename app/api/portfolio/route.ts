import { auth } from '@clerk/nextjs/server';
import { getPortfolio } from '@/lib/actions/portfolio.actions';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const portfolio = await getPortfolio(userId);
        return NextResponse.json(portfolio);
    } catch (error) {
        console.error('API Portfolio GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
