import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
    try {
        await dbConnect();
        const { code } = await params;
        const { player, score } = await req.json();

        const game = await GameSession.findOne({ code });
        if (!game) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        const playerIndex = game.players.findIndex((p: any) => p.name === player);
        if (playerIndex === -1) return NextResponse.json({ message: 'Player not found' }, { status: 404 });

        game.players[playerIndex].score = score;
        game.players[playerIndex].finished = true;

        // Check if all players finished
        const allFinished = game.players.every((p: any) => p.finished);
        if (allFinished) {
            game.status = 'FINISHED';
        }

        await game.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
