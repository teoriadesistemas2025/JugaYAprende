'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';

export default function JoinPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !name) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/games/${code}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                localStorage.setItem('rosco_guest_name', name);
                router.push(`/play/${code}?player=${name}`);
            } else {
                const data = await res.json();
                alert(data.message || 'Error al unirse');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 shadow-2xl border border-white/10 backdrop-blur-sm">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Unirse a una partida</h2>
                    <p className="mt-2 text-sm text-gray-400">Ingresa el código que te dio tu profesor</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleJoin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="code" className="sr-only">Código de partida</label>
                            <input
                                id="code"
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="relative block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors text-center tracking-widest uppercase text-lg font-mono"
                                placeholder="CÓDIGO"
                                maxLength={6}
                            />
                        </div>
                        <div>
                            <label htmlFor="name" className="sr-only">Tu Nombre</label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="relative block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors text-center"
                                placeholder="Tu Nombre"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !code || !name}
                        className="group relative flex w-full justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                            <>
                                Entrar a jugar <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
