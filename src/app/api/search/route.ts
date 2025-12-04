import { NextResponse } from 'next/server';
import { searchThibaultPart } from '@/lib/api/thibault';
import { searchMotovanPart } from '@/lib/api/motovan';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const partNumber = searchParams.get('partNumber');
    const supplier = searchParams.get('supplier') || 'both';

    if (!partNumber) {
        return NextResponse.json({ error: 'Part number is required' }, { status: 400 });
    }

    try {
        let thibault = null;
        let motovan = null;

        if (supplier === 'both') {
            // Search both suppliers in parallel
            [thibault, motovan] = await Promise.all([
                searchThibaultPart(partNumber),
                searchMotovanPart(partNumber),
            ]);
        } else if (supplier === 'thibault') {
            // Only search Thibault
            thibault = await searchThibaultPart(partNumber);
        } else if (supplier === 'motovan') {
            // Only search Motovan
            motovan = await searchMotovanPart(partNumber);
        }

        return NextResponse.json({ thibault, motovan });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
