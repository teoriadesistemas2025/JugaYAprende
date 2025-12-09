import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';
import GameConfig from '@/models/GameConfig';

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
    try {
        await dbConnect();
        const { code } = await params;

        const game = await GameSession.findOne({ code });
        if (!game) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        const config = await GameConfig.findById(game.configId);

        return NextResponse.json({
            status: game.status,
            players: game.players,
            triviaState: game.triviaState,
            config,
            reviewIndex: game.reviewIndex
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
