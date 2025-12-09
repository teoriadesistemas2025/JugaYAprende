'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { Send, SkipForward, Clock, AlertCircle, Check, X, Trophy } from 'lucide-react';

interface Question {
    letter: string;
    question: string;
    answer: string;
    startsWith: boolean;
    justification?: string;
}

interface RoscoGameProps {
    data: any;
    player: string;
    code: string;
    onFinish: (score: number) => void;
}

export default function RoscoGame({ data, player, code, onFinish }: RoscoGameProps) {
    const { config, players } = data;
    const questions: Question[] = config.questions;

    // Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, 'correct' | 'incorrect' | 'pasapalabra' | 'pending'>>({});
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [userAnswer, setUserAnswer] = useState('');
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes default
    const [isActive, setIsActive] = useState(false);
    const [finished, setFinished] = useState(false);
    const [score, setScore] = useState(0);

    // Check if everyone finished
    const allFinished = players.length > 0 && players.every((p: any) => p.finished);

    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize answers state
    useEffect(() => {
        const initialAnswers: any = {};
        questions.forEach(q => initialAnswers[q.letter] = 'pending');
        setAnswers(initialAnswers);
        setIsActive(true);
    }, []);

    // Timer
    useEffect(() => {
        if (!isActive || finished) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isActive, finished]);

    // Focus input on change
    useEffect(() => {
        if (!finished) {
            inputRef.current?.focus();
        }
    }, [currentIndex, finished]);

    const currentQuestion = questions[currentIndex];

    const handleAnswer = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (finished) return;

        const normalizedUser = userAnswer.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedCorrect = currentQuestion.answer.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Save user answer for summary
        setUserAnswers(prev => ({ ...prev, [currentQuestion.letter]: userAnswer }));

        if (normalizedUser === normalizedCorrect) {
            // Correct
            setAnswers(prev => ({ ...prev, [currentQuestion.letter]: 'correct' }));
            setScore(prev => prev + 1);
        } else {
            // Incorrect
            setAnswers(prev => ({ ...prev, [currentQuestion.letter]: 'incorrect' }));
        }

        // Move to next question immediately without feedback
        nextQuestion();
    };

    const handlePasapalabra = () => {
        if (finished) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.letter]: 'pasapalabra' }));
        nextQuestion(true);
    };

    const nextQuestion = (wasPasapalabra = false) => {
        setUserAnswer('');

        // Find next pending or pasapalabra question
        let nextIdx = (currentIndex + 1) % questions.length;
        let loops = 0;

        while (
            answers[questions[nextIdx].letter] === 'correct' ||
            answers[questions[nextIdx].letter] === 'incorrect'
        ) {
            nextIdx = (nextIdx + 1) % questions.length;
            loops++;
            if (loops > questions.length) {
                finishGame();
                return;
            }
        }

        // Check if we are stuck in a loop of completed questions (game over)
        const pendingCount = questions.filter(q =>
            answers[q.letter] === 'pending' || answers[q.letter] === 'pasapalabra'
        ).length;

        // If we just answered the last pending question
        if (pendingCount === 0 && !wasPasapalabra) {
            finishGame();
            return;
        }

        setCurrentIndex(nextIdx);
    };

    const finishGame = () => {
        setFinished(true);
        setIsActive(false);
        const finalScore = questions.filter(q => answers[q.letter] === 'correct').length;
        if (finalScore === questions.length) {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        }
        onFinish(finalScore * 100); // 100 points per correct answer
    };

    // Calculate position for letters in a circle
    const radius = 210; // px
    const center = 230; // px

    // --- VIEW: GLOBAL LEADERBOARD (Everyone Finished) ---
    if (allFinished) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center">
                <div className="max-w-2xl w-full bg-white/5 rounded-2xl p-8 border border-white/10 animate-in zoom-in duration-500">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-yellow-400 mb-2">¡Juego Terminado!</h1>
                        <p className="text-gray-400">Ranking Final</p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Trophy className="w-6 h-6 text-yellow-400" /> Mejores Jugadores
                        </h2>
                        {players.sort((a: any, b: any) => b.score - a.score).slice(0, 3).map((p: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                                        i === 0 ? "bg-yellow-500 text-black" :
                                            i === 1 ? "bg-gray-400 text-black" :
                                                i === 2 ? "bg-orange-700 text-white" : "bg-gray-700 text-gray-300"
                                    )}>
                                        {i + 1}
                                    </div>
                                    <span className="font-bold text-xl">{p.name}</span>
                                </div>
                                <span className="font-mono font-bold text-2xl text-yellow-400">{p.score}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="text-blue-400 hover:text-blue-300 underline"
                        >
                            Volver a inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: SUMMARY / WAITING (I finished, others haven't) ---
    if (finished) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold mb-4 text-yellow-400">¡Juego Terminado!</h1>
                        <div className="flex justify-center gap-8">
                            <div className="bg-green-900/30 px-8 py-4 rounded-2xl border border-green-500/30">
                                <div className="text-5xl font-bold text-green-400 mb-1">
                                    {questions.filter(q => answers[q.letter] === 'correct').length}
                                </div>
                                <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">Aciertos</div>
                            </div>
                            <div className="bg-red-900/30 px-8 py-4 rounded-2xl border border-red-500/30">
                                <div className="text-5xl font-bold text-red-400 mb-1">
                                    {questions.filter(q => answers[q.letter] === 'incorrect').length}
                                </div>
                                <div className="text-sm text-gray-400 uppercase tracking-wider font-bold">Fallos</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Resumen de Respuestas</h2>
                        {questions.map((q) => {
                            const status = answers[q.letter];
                            const isCorrect = status === 'correct';

                            return (
                                <div key={q.letter} className="bg-white/5 rounded-xl p-6 border border-white/10 flex gap-6 items-start">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0",
                                        isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                                    )}>
                                        {q.letter}
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-gray-300 mb-2 text-sm">{q.question}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-1">Tu respuesta</span>
                                                <div className={cn(
                                                    "font-bold text-lg flex items-center gap-2",
                                                    isCorrect ? "text-green-400" : "text-red-400"
                                                )}>
                                                    {userAnswers[q.letter] || '-'}
                                                    {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                </div>
                                            </div>

                                            {!isCorrect && (
                                                <div>
                                                    <span className="text-xs text-gray-500 block mb-1">Respuesta correcta</span>
                                                    <div className="font-bold text-lg text-yellow-400">
                                                        {q.answer}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {q.justification && (
                                            <div className="mt-4 bg-blue-900/20 p-3 rounded-lg border border-blue-500/20 text-sm text-blue-200">
                                                <span className="font-bold mr-2">ℹ️ Info:</span>
                                                {q.justification}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 text-center text-gray-500">
                        Esperando a que todos los jugadores terminen para ver el ranking global...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-2 flex flex-col items-center overflow-hidden">
            {/* Header */}
            <div className="w-full max-w-3xl flex justify-between items-center mb-4 px-4 mt-2">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                    <Clock className={cn("w-5 h-5", timeLeft < 30 ? "text-red-400 animate-pulse" : "text-blue-400")} />
                    <span className={cn("font-mono font-bold text-xl", timeLeft < 30 ? "text-red-400" : "text-white")}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                </div>
                <div className="bg-blue-600 px-4 py-2 rounded-full font-bold shadow-lg shadow-blue-500/20">
                    {score} pts
                </div>
            </div>

            {/* Rosco Circle */}
            <div className="relative w-[460px] h-[460px] mb-8 flex-shrink-0 scale-90 sm:scale-100">
                {questions.map((q, i) => {
                    const angle = (i * 360) / questions.length - 90; // Start at top
                    const radian = (angle * Math.PI) / 180;
                    const x = center + radius * Math.cos(radian);
                    const y = center + radius * Math.sin(radian);

                    const status = answers[q.letter] || 'pending';
                    const isCurrent = i === currentIndex;

                    return (
                        <div
                            key={q.letter}
                            className={cn(
                                "absolute w-14 h-14 -ml-7 -mt-7 rounded-full flex items-center justify-center text-2xl font-bold border-2 transition-all duration-300",
                                isCurrent ? "scale-125 z-10 shadow-[0_0_15px_rgba(59,130,246,0.8)]" : "scale-100",
                                status === 'correct' ? "bg-green-500 border-green-400 text-white" :
                                    status === 'incorrect' ? "bg-red-500 border-red-400 text-white" :
                                        status === 'pasapalabra' ? "bg-yellow-500 border-yellow-400 text-black" : // Pasapalabra style
                                            isCurrent ? "bg-blue-600 border-blue-400 text-white" :
                                                "bg-slate-800 border-slate-600 text-gray-400"
                            )}
                            style={{ left: x, top: y }}
                        >
                            {q.letter}
                        </div>
                    );
                })}

                {/* Center Info */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-8xl font-bold text-white mb-4 drop-shadow-lg">
                            {currentQuestion.letter}
                        </div>
                        <div className="text-lg font-medium text-blue-300 bg-blue-900/30 px-6 py-2 rounded-full inline-block border border-blue-500/30">
                            {currentQuestion.startsWith ? 'Empieza por' : 'Contiene'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <div className="w-full max-w-3xl flex-1 flex flex-col justify-end pb-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4 relative overflow-hidden min-h-[120px] flex items-center justify-center">
                    <p className="text-lg md:text-xl text-center leading-relaxed font-medium">
                        {currentQuestion.question}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                    <form onSubmit={handleAnswer} className="flex-1 flex gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-500"
                            autoComplete="off"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!userAnswer.trim()}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={handlePasapalabra}
                        className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 px-6 rounded-xl font-bold transition-colors flex items-center gap-2"
                    >
                        <SkipForward className="w-5 h-5" />
                        <span className="hidden sm:inline">PASAPALABRA</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
