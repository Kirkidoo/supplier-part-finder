import { NextResponse } from 'next/server';
import { fetchItlFeedFromFtp } from '@/lib/api/itl';

export async function POST() {
    try {
        const success = await fetchItlFeedFromFtp();
        if (success) {
            return NextResponse.json({ message: 'ITL feed updated successfully' });
        } else {
            return NextResponse.json({ error: 'Failed to update ITL feed' }, { status: 500 });
        }
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
