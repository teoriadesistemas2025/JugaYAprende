import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameConfig from '@/models/GameConfig';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function getUser(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) return null;

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch (error) {
        return null;
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const userId = await getUser(req);
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const rosco = await GameConfig.findOne({ _id: id, creatorId: userId });

        if (!rosco) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        return NextResponse.json(rosco);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const userId = await getUser(req);
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const { title, questions } = await req.json();

        const rosco = await GameConfig.findOneAndUpdate(
            { _id: id, creatorId: userId },
            { title, questions, updatedAt: Date.now() },
            { new: true }
        );

        if (!rosco) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        return NextResponse.json(rosco);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const userId = await getUser(req);
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const rosco = await GameConfig.findOneAndDelete({ _id: id, creatorId: userId });

        if (!rosco) return NextResponse.json({ message: 'Not found' }, { status: 404 });

        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
