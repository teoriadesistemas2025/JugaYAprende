import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import GameConfig from '@/models/GameConfig';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await dbConnect();

        // 1. Create Test User
        const hashedPassword = await bcrypt.hash('password123', 10);
        let user = await User.findOne({ username: 'testuser' });

        if (!user) {
            user = await User.create({
                username: 'testuser',
                password: hashedPassword,
            });
        }

        // 2. Create Test Rosco
        const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const questions = ALPHABET.map(letter => ({
            letter,
            question: `Question for ${letter}`,
            answer: `Answer${letter}`,
            startsWith: true
        }));

        const rosco = await GameConfig.create({
            title: 'Test Rosco',
            creatorId: user._id,
            questions,
        });

        return NextResponse.json({ message: 'Seeded successfully', user: 'testuser', password: 'password123', roscoId: rosco._id });
    } catch (error: any) {
        return NextResponse.json({ message: 'Error seeding', error: error.message }, { status: 500 });
    }
}
