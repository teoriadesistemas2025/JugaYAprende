import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameSession from '@/models/GameSession';

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
    try {
        await dbConnect();
        const { code } = await params;
        const { name } = await req.json();

        if (!name) {
            return NextResponse.json({ message: 'Name is required' }, { status: 400 });
        }

        const game = await GameSession.findOne({ code });
        if (!game) {
            return NextResponse.json({ message: 'Game not found' }, { status: 404 });
        }

        // Check if player already exists
        const existingPlayer = game.players.find((p: any) => p.name === name);
        if (!existingPlayer) {
            game.players.push({
                name,
                score: 0,
                progress: {},
                finished: false
            });
            await game.save();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error joining game:', error);
        return NextResponse.json({ message: 'Error joining game' }, { status: 500 });
    }
}
