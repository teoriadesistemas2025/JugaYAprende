import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { message: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        const user = await User.findOne({ username });
        if (!user) {
            return NextResponse.json(
                { message: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { message: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
            expiresIn: '7d',
        });

        const response = NextResponse.json(
            { message: 'Login exitoso', user: { id: user._id, username: user.username } },
            { status: 200 }
        );

        // Set JWT cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        // Set UI cookie (legacy/frontend use)
        response.cookies.set('rosco_user', JSON.stringify({ id: user._id, username: user.username }), {
            httpOnly: false,
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;

    } catch (error) {
        console.error('Error en login:', error);
        return NextResponse.json(
            { message: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
