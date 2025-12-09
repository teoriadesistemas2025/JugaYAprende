import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GameConfig from '@/models/GameConfig';
import { cookies } from 'next/headers';

// Helper to get user from cookie (simplified for this demo)
async function getUser() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('rosco_user');
    if (!userCookie) return null;
    try {
        return JSON.parse(userCookie.value);
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        await dbConnect();
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const roscos = await GameConfig.find({ creatorId: user.id }).sort({ createdAt: -1 });
        return NextResponse.json(roscos);
    } catch {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    console.log('API: POST /api/roscos called');
    try {
        await dbConnect();
        console.log('API: DB Connected');
        const user = await getUser();
        console.log('API: User:', user);

        if (!user) {
            console.log('API: Unauthorized');
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('API: Body received:', body);

        const rosco = await GameConfig.create({
            ...body,
            creatorId: user.id,
        });
        console.log('API: Game created:', rosco);

        return NextResponse.json(rosco, { status: 201 });
    } catch (error) {
        console.error('API: Error creating game:', error);
        return NextResponse.json({ message: 'Error creating game', error: String(error) }, { status: 500 });
    }
}
