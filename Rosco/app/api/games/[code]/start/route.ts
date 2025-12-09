import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
    try {
        await dbConnect();
        const { code } = await params;

        const game = await GameSession.findOne({ code });
        if (!game) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        game.status = 'PLAYING';
        game.startTime = new Date();
        await game.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
