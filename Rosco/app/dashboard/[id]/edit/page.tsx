'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TriviaEditor from '../../components/editors/TriviaEditor';
import BattleshipEditor from '../../components/editors/BattleshipEditor';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Question {
    letter: string;
    question: string;
    answer: string;
    startsWith: boolean;
    justification?: string;
}

export default function EditGamePage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [game, setGame] = useState<any>(null);

    // Rosco specific state
    const [roscoTitle, setRoscoTitle] = useState('');
    const [roscoQuestions, setRoscoQuestions] = useState<Question[]>([]);
    const [selectedLetter, setSelectedLetter] = useState('A');

    const id = params.id as string;

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const res = await fetch(`/api/roscos/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGame(data);

                    // Initialize Rosco state if applicable
                    if (data.type === 'ROSCO' || !data.type) {
                        setRoscoTitle(data.title);
                        const mergedQuestions = ALPHABET.map(letter => {
                            const existing = data.questions.find((q: Question) => q.letter === letter);
                            return existing || {
                                letter,
                                question: '',
                                answer: '',
                                startsWith: true,
                                justification: ''
                            };
                        });
                        setRoscoQuestions(mergedQuestions);
                    }
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchGame();
    }, [id, router]);

    const handleRoscoSave = async () => {
        if (!roscoTitle.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/roscos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: roscoTitle, questions: roscoQuestions }),
            });
            if (res.ok) router.push('/dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleGenericSave = async (data: { title: string, questions: any }) => {
        setSaving(true);
        try {
            let payloadQuestions = data.questions;
            if (game.type === 'TRIVIA' || game.type === 'KAHOOT') {
                payloadQuestions = { questions: data.questions };
            }

            const res = await fetch(`/api/roscos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: data.title, questions: payloadQuestions }),
            });
            if (res.ok) router.push('/dashboard');
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleRoscoQuestionChange = (field: keyof Question, value: string | boolean) => {
        setRoscoQuestions(prev => prev.map(q =>
            q.letter === selectedLetter ? { ...q, [field]: value } : q
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (game?.type === 'TRIVIA' || game?.type === 'KAHOOT') {
        return (
            <div className="min-h-screen bg-background p-8">
                <TriviaEditor
                    initialData={{
                        title: game.title,
                        questions: game.questions.questions || []
                    }}
                    onSave={handleGenericSave}
                    onCancel={() => router.back()}
                    saving={saving}
                />
            </div>
        );
    }

    if (game?.type === 'BATTLESHIP') {
        return (
            <div className="min-h-screen bg-background p-8">
                <BattleshipEditor
                    initialData={{
                        title: game.title,
                        ships: game.questions.ships || [],
                        pool: game.questions.pool || []
                    }}
                    onSave={async (data) => {
                        await handleGenericSave({
                            title: data.title,
                            questions: { ships: data.ships, pool: data.pool }
                        });
                    }}
                    onCancel={() => router.back()}
                    saving={saving}
                />
            </div>
        );
    }

    if (game?.type === 'HANGMAN') {
        // Inline Hangman Editor (simplified)
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" /> Volver
                        </button>
                        <h1 className="text-3xl font-bold text-white">Editar Ahorcado</h1>
                        <button
                            onClick={() => handleGenericSave({ title: game.title, questions: game.questions })}
                            disabled={saving || !game.title.trim() || !game.questions.word.trim()}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Guardar Cambios
                        </button>
                    </div>

                    <div className="bg-card border border-white/10 rounded-xl p-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Título del Juego</label>
                        <input
                            type="text"
                            value={game.title}
                            onChange={(e) => setGame({ ...game, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div className="bg-card border border-white/10 rounded-xl p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Palabra o Frase Oculta</label>
                            <input
                                type="text"
                                value={game.questions.word}
                                onChange={(e) => setGame({ ...game, questions: { ...game.questions, word: e.target.value.toUpperCase() } })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono text-xl tracking-wider uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Pista (Opcional)</label>
                            <input
                                type="text"
                                value={game.questions.hint || ''}
                                onChange={(e) => setGame({ ...game, questions: { ...game.questions, hint: e.target.value } })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default to Rosco Editor
    const currentQuestion = roscoQuestions.find(q => q.letter === selectedLetter);

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" /> Volver
                    </button>
                    <h1 className="text-3xl font-bold text-white">Editar Rosco</h1>
                    <button
                        onClick={handleRoscoSave}
                        disabled={saving || !roscoTitle.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Guardar Cambios
                    </button>
                </div>

                {/* Title Input */}
                <div className="bg-card border border-white/10 rounded-xl p-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Título del Rosco</label>
                    <input
                        type="text"
                        value={roscoTitle}
                        onChange={(e) => setRoscoTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej: Rosco de Geografía"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Letter Selector */}
                    <div className="lg:col-span-1 bg-card border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Letras</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {ALPHABET.map(letter => {
                                const q = roscoQuestions.find(qu => qu.letter === letter);
                                const isComplete = q?.question && q?.answer;
                                return (
                                    <button
                                        key={letter}
                                        onClick={() => setSelectedLetter(letter)}
                                        className={cn(
                                            "w-10 h-10 rounded-lg font-bold transition-all",
                                            selectedLetter === letter
                                                ? "bg-blue-600 text-white ring-2 ring-blue-400"
                                                : isComplete
                                                    ? "bg-green-900/40 text-green-400 border border-green-500/30"
                                                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                                        )}
                                    >
                                        {letter}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Question Editor */}
                    <div className="lg:col-span-2 bg-card border border-white/10 rounded-xl p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-bold text-white">Letra {selectedLetter}</h2>
                            <div className="flex bg-white/5 rounded-lg p-1">
                                <button
                                    onClick={() => handleRoscoQuestionChange('startsWith', true)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                        currentQuestion?.startsWith ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Empieza con
                                </button>
                                <button
                                    onClick={() => handleRoscoQuestionChange('startsWith', false)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                        !currentQuestion?.startsWith ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    Contiene
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Pregunta / Definición</label>
                                <textarea
                                    value={currentQuestion?.question || ''}
                                    onChange={(e) => handleRoscoQuestionChange('question', e.target.value)}
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Escribe la definición aquí..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Respuesta Correcta</label>
                                <input
                                    type="text"
                                    value={currentQuestion?.answer || ''}
                                    onChange={(e) => handleRoscoQuestionChange('answer', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="La respuesta exacta"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    Justificación / Curiosidad <span className="text-xs text-gray-500">(Opcional)</span>
                                </label>
                                <textarea
                                    value={currentQuestion?.justification || ''}
                                    onChange={(e) => handleRoscoQuestionChange('justification', e.target.value)}
                                    className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Explicación adicional que se mostrará al finalizar el juego..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
