'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface KahootGameProps {
    data: any;
    player: string;
    code: string;
}

export default function KahootGame({ data, player, code }: KahootGameProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);

    const { config, kahootState, myScore } = data;
    const questions = Array.isArray(config.questions) ? config.questions : config.questions.questions;
    const currentQ = questions[kahootState?.currentQuestionIndex || 0];
    const phase = kahootState?.phase || 'LOBBY'; // LOBBY, PREVIEW, ANSWERING, RESULTS, LEADERBOARD, PODIUM

    // Reset local state when question changes or phase changes to PREVIEW
    useEffect(() => {
        if (phase === 'PREVIEW') {
            setSelectedAnswer(null);
            setHasAnswered(false);
        }
    }, [phase, kahootState?.currentQuestionIndex]);

    const handleAnswer = async (answerIndex: number) => {
        if (hasAnswered || phase !== 'ANSWERING') return;

        const answerText = currentQ.options[answerIndex];
        setSelectedAnswer(answerText);
        setHasAnswered(true);

        try {
            await fetch(`/api/games/${code}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player,
                    action: 'KAHOOT_ANSWER',
                    answer: answerText,
                    answerIndex
                })
            });
        } catch (err) {
            console.error(err);
        }
    };

    // Colors for options: Red, Blue, Yellow, Green
    const colors = [
        'bg-red-500 hover:bg-red-400 border-red-700',
        'bg-blue-500 hover:bg-blue-400 border-blue-700',
        'bg-yellow-500 hover:bg-yellow-400 border-yellow-700',
        'bg-green-500 hover:bg-green-400 border-green-700'
    ];

    const shapes = ['▲', '◆', '●', '■'];

    if (phase === 'LOBBY') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-4xl font-bold mb-4 animate-bounce">¡Ya estás dentro!</h1>
                <p className="text-xl text-gray-400">Ves tu nombre en la pantalla?</p>
                <div className="mt-8 text-2xl font-bold text-blue-400">{player}</div>
            </div>
        );
    }

    if (phase === 'PREVIEW') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-400">Pregunta {kahootState.currentQuestionIndex + 1}</h2>
                <div className="text-4xl font-bold animate-pulse">¡Prepárate!</div>
            </div>
        );
    }

    if (phase === 'ANSWERING') {
        if (hasAnswered) {
            return (
                <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
                    <div className="text-4xl font-bold mb-4">¡Respuesta enviada!</div>
                    <p className="text-xl text-gray-400">Espera a que se acabe el tiempo...</p>
                    <div className="mt-8 animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-900 p-4 grid grid-cols-2 gap-4">
                {currentQ.options.map((opt: string, i: number) => (
                    <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className={cn(
                            "flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 border-b-8 h-full",
                            colors[i % 4]
                        )}
                    >
                        <span className="text-4xl mb-2 text-white/50">{shapes[i % 4]}</span>
                        {/* In Kahoot, sometimes text is only on host screen, but let's show it here too for better UX */}
                        <span className="text-xl font-bold text-white p-4 text-center">{opt}</span>
                    </button>
                ))}
            </div>
        );
    }

    if (phase === 'RESULTS' || phase === 'LEADERBOARD') {
        const isCorrect = kahootState.lastAnswerCorrect;
        const points = kahootState.lastPointsEarned || 0;

        // Trigger confetti if correct and just entering this phase (could use a ref to track if confetti played)
        // For simplicity, we just show the screen.

        return (
            <div className={cn(
                "min-h-screen flex flex-col items-center justify-center p-8 text-center",
                isCorrect ? "bg-green-600" : "bg-red-600"
            )}>
                <h1 className="text-5xl font-bold text-white mb-4">
                    {isCorrect ? "¡Correcto!" : "¡Incorrecto!"}
                </h1>
                {isCorrect && (
                    <div className="text-3xl font-bold text-white/90 mb-8">
                        +{points} pts
                    </div>
                )}
                {!isCorrect && (
                    <div className="text-xl text-white/80 mb-8">
                        ¡Ánimo para la próxima!
                    </div>
                )}
                <div className="bg-black/20 p-6 rounded-xl backdrop-blur-sm">
                    <p className="text-white/80 text-sm uppercase tracking-wider mb-2">Puntaje Total</p>
                    <p className="text-4xl font-bold text-white">{myScore}</p>
                </div>
                <div className="mt-8 text-white/80">
                    Mira la pantalla del profesor para ver el ranking
                </div>
            </div>
        );
    }

    if (phase === 'PODIUM') {
        return (
            <div className="min-h-screen bg-purple-900 text-white flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-4xl font-bold mb-8">¡Juego Terminado!</h1>
                <div className="text-2xl mb-4">Tu posición final:</div>
                <div className="text-6xl font-bold text-yellow-400 mb-8">#{kahootState.myRank || '?'}</div>
                <div className="text-3xl font-bold">{myScore} pts</div>
            </div>
        );
    }

    return null;
}
