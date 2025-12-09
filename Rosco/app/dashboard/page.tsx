'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Play, Edit, Trash2, Loader2 } from 'lucide-react';

interface GameConfig {
    _id: string;
    title: string;
    type: 'ROSCO' | 'HANGMAN' | 'TRIVIA' | 'WORD_SEARCH' | 'MEMORY' | 'BATTLESHIP' | 'KAHOOT';
    questions: unknown[];
    createdAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [roscos, setRoscos] = useState<GameConfig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoscos();
    }, []);

    const fetchRoscos = async () => {
        try {
            const res = await fetch('/api/roscos');
            if (res.ok) {
                const data = await res.json();
                setRoscos(data);
            }
        } catch (error) {
            console.error('Error fetching roscos:', error);
        } finally {
            setLoading(false);
        }
    };

    const createGame = async (configId: string) => {
        try {
            const res = await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configId }),
            });

            if (res.ok) {
                const { code } = await res.json();
                router.push(`/host/${code}`);
            }
        } catch (error) {
            console.error('Error creating game:', error);
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            const res = await fetch(`/api/roscos/${deleteId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setRoscos(roscos.filter(r => r._id !== deleteId));
            }
        } catch (error) {
            console.error('Error deleting game:', error);
        } finally {
            setDeleteId(null);
        }
    };

    const getQuestionCount = (rosco: any) => {
        if (!rosco.questions) return 0;
        if (Array.isArray(rosco.questions)) return rosco.questions.length; // Rosco (old)
        if (rosco.type === 'TRIVIA' && rosco.questions.questions) return rosco.questions.questions.length;
        if (rosco.type === 'BATTLESHIP' && rosco.questions.pool) return rosco.questions.pool.length;
        if (rosco.type === 'MEMORY' && rosco.questions.pairs) return rosco.questions.pairs.length;
        if (rosco.type === 'WORD_SEARCH' && rosco.questions.words) return rosco.questions.words.length;
        if (rosco.type === 'HANGMAN') return 1;
        return 0;
    };

    const getTypeTitle = (type: string) => {
        switch (type) {
            case 'ROSCO': return 'Roscos';
            case 'HANGMAN': return 'Ahorcados';
            case 'TRIVIA': return 'Preguntados';
            case 'WORD_SEARCH': return 'Sopas de Letras';
            case 'MEMORY': return 'Memoramas';
            case 'BATTLESHIP': return 'Batalla Naval';
            case 'KAHOOT': return 'Desafíos';
            default: return 'Otros';
        }
    };

    const gamesByType = {
        ROSCO: roscos.filter(g => g.type === 'ROSCO'),
        HANGMAN: roscos.filter(g => g.type === 'HANGMAN'),
        TRIVIA: roscos.filter(g => g.type === 'TRIVIA'),
        KAHOOT: roscos.filter(g => g.type === 'KAHOOT'),
        WORD_SEARCH: roscos.filter(g => g.type === 'WORD_SEARCH'),
        MEMORY: roscos.filter(g => g.type === 'MEMORY'),
        BATTLESHIP: roscos.filter(g => g.type === 'BATTLESHIP'),
    };

    const hasGames = roscos.length > 0;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Mis Juegos</h1>
                        <p className="text-gray-400">Gestiona tus partidas y preguntas</p>
                        <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2">
                            &larr; Volver al Inicio
                        </Link>
                    </div>
                    <Link
                        href="/dashboard/create"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-blue-500/25"
                    >
                        <Plus className="w-5 h-5" />
                        Crear Nuevo Juego
                    </Link>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    </div>
                ) : !hasGames ? (
                    <div className="text-center py-20 bg-card rounded-3xl border border-white/5">
                        <h3 className="text-xl font-semibold text-white mb-2">No tienes juegos creados</h3>
                        <p className="text-gray-400 mb-8">Crea tu primer juego para empezar a jugar con tus alumnos</p>
                        <Link
                            href="/dashboard/create"
                            className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                            Crear ahora &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(gamesByType).map(([type, games]) => {
                            if (games.length === 0) return null;

                            return (
                                <div key={type}>
                                    <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-2">
                                        {getTypeTitle(type)}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {games.map((rosco) => (
                                            <div key={rosco._id} className="bg-card rounded-2xl p-6 border border-white/10 hover:border-blue-500/50 transition-all group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${rosco.type === 'BATTLESHIP' ? 'bg-blue-900/30' :
                                                            rosco.type === 'TRIVIA' ? 'bg-yellow-900/30' :
                                                                rosco.type === 'WORD_SEARCH' ? 'bg-green-900/30' :
                                                                    rosco.type === 'MEMORY' ? 'bg-purple-900/30' :
                                                                        rosco.type === 'HANGMAN' ? 'bg-pink-900/30' :
                                                                            rosco.type === 'KAHOOT' ? 'bg-orange-900/30' :
                                                                                'bg-gray-800'
                                                        }`}>
                                                        <span className="text-gray-400 grayscale">
                                                            {rosco.type === 'BATTLESHIP' ? '🚢' :
                                                                rosco.type === 'TRIVIA' ? '❓' :
                                                                    rosco.type === 'WORD_SEARCH' ? '🍲' :
                                                                        rosco.type === 'MEMORY' ? '🃏' :
                                                                            rosco.type === 'HANGMAN' ? '🧍' :
                                                                                rosco.type === 'KAHOOT' ? '🆚' : '🎲'}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                                        {new Date(rosco.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2">{rosco.title}</h3>
                                                <p className="text-sm text-gray-400 mb-6">
                                                    {getQuestionCount(rosco)} preguntas
                                                </p>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => createGame(rosco._id)}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                                    >
                                                        <Play className="w-4 h-4" /> Jugar
                                                    </button>
                                                    <Link
                                                        href={`/dashboard/${rosco._id}/edit`}
                                                        className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(rosco._id)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteId && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
                            <h3 className="text-2xl font-bold text-white mb-4">¿Eliminar juego?</h3>
                            <p className="text-gray-400 mb-8">
                                Esta acción no se puede deshacer. El juego y todas sus preguntas se eliminarán permanentemente.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
