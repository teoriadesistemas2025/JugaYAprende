'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { Send, SkipForward, Clock, AlertCircle, Check, X, Trophy, Search, ChevronRight } from 'lucide-react';

interface Question {
    letter: string;
    question: string;
    answer: string;
    startsWith: boolean;
    justification?: string;
    disabled?: boolean;
}

interface RoscoGameProps {
    data: any;
    player: string;
    code: string;
    onFinish: (score: number) => void;
    onScoreUpdate?: (score: number) => void;
}

export default function RoscoGame({ data, player, code, onFinish, onScoreUpdate }: RoscoGameProps) {
    const { config, players } = data;
    const questions: Question[] = config.questions;

    // Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, 'correct' | 'incorrect' | 'pasapalabra' | 'pending' | 'disabled'>>({});
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [userAnswer, setUserAnswer] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [finished, setFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [showReview, setShowReview] = useState(false);

    // Filter out disabled questions for review if desired, or keep them but skip.
    // User wants "one by one", so let's just map all non-disabled or all questions.
    // Let's filter out disabled for a cleaner review.
    const reviewableQuestions = questions.filter(q => !q.disabled);
    const currentReviewQ = reviewableQuestions[reviewIndex];

    // Check if everyone finished
    const sortedPlayers = [...players].sort((a: any, b: any) => b.score - a.score);
    const top3 = sortedPlayers.slice(0, 3);
    const myPlayerObj = players.find((p: any) => p.name === player);
    const amIInTop3 = top3.some((p: any) => p.name === player);
    const allFinished = players.length > 0 && players.every((p: any) => p.finished);

    const inputRef = useRef<HTMLInputElement>(null);

    // Timer
    const timeLimit = config.questions.timeLimit || 180;
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    const [statusText, setStatusText] = useState('');

    // Timer Effect
    useEffect(() => {
        if (!isActive || finished) return;
        const timer = setInterval(() => {
            setTimeLeft((prev: number) => {
                if (prev <= 1) {
                    finishGame('TIMEOUT');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isActive, finished]);

    // Focus input on change
    useEffect(() => {
        if (!finished && !currentQuestion?.disabled) {
            inputRef.current?.focus();
        }
    }, [currentIndex, finished]);

    const currentQuestion = questions[currentIndex];

    // Listen to changes to skip disabled if for some reason we land on one
    useEffect(() => {
        if (currentQuestion?.disabled && !finished && isActive) {
            nextQuestion();
        }
    }, [currentIndex]);


    const handleAnswer = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (finished || !currentQuestion || currentQuestion.disabled) return;

        const normalizedUser = userAnswer.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedCorrect = currentQuestion.answer.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Save user answer
        setUserAnswers(prev => ({ ...prev, [currentQuestion.letter]: userAnswer }));

        const isCorrect = normalizedUser === normalizedCorrect;

        setAnswers(prev => ({ ...prev, [currentQuestion.letter]: isCorrect ? 'correct' : 'incorrect' }));

        if (isCorrect) {
            const newScore = score + 1;
            setScore(newScore);
            if (onScoreUpdate) onScoreUpdate(newScore * 100);
        }

        nextQuestion();
    };

    const handlePasapalabra = () => {
        if (finished) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.letter]: 'pasapalabra' }));
        nextQuestion(true);
    };

    const nextQuestion = (wasPasapalabra = false) => {
        setUserAnswer('');

        // Find next pending or pasapalabra question (skipping disabled)
        let nextIdx = (currentIndex + 1) % questions.length;
        let loops = 0;

        while (
            answers[questions[nextIdx].letter] === 'correct' ||
            answers[questions[nextIdx].letter] === 'incorrect' ||
            questions[nextIdx].disabled // Skip disabled
        ) {
            nextIdx = (nextIdx + 1) % questions.length;
            loops++;
            if (loops > questions.length) {
                // Should check if really finished
                checkFinish();
                return;
            }
        }

        // Check if we are stuck in a loop of completed questions (game over)
        const pendingCount = questions.filter(q =>
            !q.disabled && (answers[q.letter] === 'pending' || answers[q.letter] === 'pasapalabra')
        ).length;

        // If we just answered the last pending question
        if (pendingCount === 0 && !wasPasapalabra) {
            // Need one more check: if only pasapalabras remain, we continue looping. 
            // If ALL are answered (correct/incorrect) or disabled, then finish.
            const allDone = questions.every(q =>
                q.disabled || answers[q.letter] === 'correct' || answers[q.letter] === 'incorrect'
            );

            if (allDone) {
                checkFinish();
                return;
            }
        }

        setCurrentIndex(nextIdx);
    };

    const checkFinish = () => {
        const allDone = questions.every(q =>
            q.disabled || answers[q.letter] === 'correct' || answers[q.letter] === 'incorrect'
        );
        if (allDone) {
            finishGame('COMPLETED');
        }
    }

    const finishGame = (reason: 'TIMEOUT' | 'COMPLETED' = 'COMPLETED') => {
        if (finished) return;
        setFinished(true);
        setIsActive(false);
        setStatusText(reason === 'TIMEOUT' ? '¡TIEMPO AGOTADO!' : '¡ROSCO COMPLETADO!');

        const correctCount = questions.filter(q => answers[q.letter] === 'correct').length;

        if (reason === 'COMPLETED' && correctCount > 0) {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        }

        onFinish(correctCount * 100); // 100 points per correct answer
    };

    // Calculate position for letters in a circle
    const radius = 210; // px
    const center = 230; // px

    // --- VIEW: GAME OVER (Finished or All Finished) ---
    if (finished || allFinished) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">
                <div className="max-w-5xl w-full bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-2xl relative animate-in fade-in duration-500">
                    {/* Confetti if won/good score */}
                    {statusText === '¡ROSCO COMPLETADO!' && <div className="absolute inset-0 overflow-hidden pointer-events-none" />}

                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className={cn(
                            "text-5xl font-black mb-2 animate-bounce",
                            statusText === '¡TIEMPO AGOTADO!' ? "text-red-500" : "text-yellow-400"
                        )}>
                            {statusText || '¡Juego Terminado!'}
                        </h1>
                        <p className="text-xl text-gray-400">Resultados del Rosco</p>
                    </div>

                    {/* Podium - Added margin top to prevent overlap */}
                    <div className="flex justify-center items-end gap-4 mb-12 h-64 mt-16">
                        {top3.map((p: any, i: number) => (
                            <div key={i} className={cn(
                                "relative flex flex-col items-center justify-end rounded-t-lg transition-all duration-1000 ease-out",
                                i === 0 ? "w-32 h-64 bg-yellow-500 z-10 order-2 shadow-[0_0_30px_rgba(234,179,8,0.5)]" :
                                    i === 1 ? "w-28 h-48 bg-gray-400 order-1 opacity-90" :
                                        "w-28 h-32 bg-orange-700 order-3 opacity-90"
                            )}>
                                {/* Avatar/Name */}
                                <div className="absolute -top-16 flex flex-col items-center w-full">
                                    <Trophy className={cn("w-10 h-10 mb-2",
                                        i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-orange-400"
                                    )} />
                                    <span className="font-bold text-white text-lg truncate w-full text-center px-2 shadow-black drop-shadow-md">{p.name}</span>
                                </div>
                                <span className="text-4xl font-black text-black/50 mb-4">{i + 1}</span>
                                <div className="mb-2 bg-black/20 px-3 py-1 rounded-full text-white font-mono font-bold">
                                    {p.score} pts
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* My Rank (if not in top 3) */}
                    {!amIInTop3 && myPlayerObj && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between max-w-md mx-auto mb-8 animate-in slide-in-from-bottom-5">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold text-gray-500">#{players.findIndex((p: any) => p.name === player) + 1}</span>
                                <span className="text-xl font-bold">{player}</span>
                            </div>
                            <span className="text-2xl font-mono font-bold text-blue-400">{myPlayerObj.score} pts</span>
                        </div>
                    )}

                    {/* Review Button */}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => {
                                setReviewIndex(0);
                                setShowReview(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105 flex items-center gap-2"
                        >
                            <Search className="w-5 h-5" />
                            Ver mis respuestas
                        </button>
                    </div>

                    {/* Review Modal - CAROUSEL MODE */}
                    {showReview && (
                        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl h-auto min-h-[500px] flex flex-col relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800 rounded-t-2xl">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Search className="w-6 h-6 text-blue-400" />
                                        Revisión de Rosco
                                    </h2>
                                    <div className="text-gray-400 font-mono">
                                        {reviewIndex + 1} / {reviewableQuestions.length}
                                    </div>
                                    <button onClick={() => setShowReview(false)} className="text-gray-400 hover:text-white p-2">
                                        ✕ Cerrar
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                                    {currentReviewQ && (() => {
                                        const status = answers[currentReviewQ.letter];
                                        const isCorrect = status === 'correct';
                                        const myAns = userAnswers[currentReviewQ.letter] || '-';

                                        return (
                                            <div key={currentReviewQ.letter} className="w-full max-w-2xl animate-in slide-in-from-right-10 duration-300">
                                                {/* Letter Badge */}
                                                <div className="flex justify-center mb-6">
                                                    <div className={cn(
                                                        "w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl border-4",
                                                        isCorrect ? "bg-green-500 border-green-400 text-white" :
                                                            status === 'incorrect' ? "bg-red-500 border-red-400 text-white" :
                                                                "bg-yellow-500 border-yellow-400 text-black"
                                                    )}>
                                                        {currentReviewQ.letter}
                                                    </div>
                                                </div>

                                                {/* Question */}
                                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6 text-center">
                                                    <p className="text-xl md:text-2xl font-medium leading-relaxed">{currentReviewQ.question}</p>
                                                </div>

                                                {/* Answers Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                    <div className={cn(
                                                        "p-4 rounded-xl border flex flex-col items-center",
                                                        isCorrect ? "bg-green-900/20 border-green-500/30" : "bg-red-900/20 border-red-500/30"
                                                    )}>
                                                        <span className="text-sm text-gray-400 mb-1">Tu respuesta</span>
                                                        <span className={cn(
                                                            "text-xl font-bold flex items-center gap-2",
                                                            isCorrect ? "text-green-400" : "text-red-400"
                                                        )}>
                                                            {myAns}
                                                            {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                        </span>
                                                    </div>

                                                    <div className="bg-slate-800 p-4 rounded-xl border border-white/10 flex flex-col items-center">
                                                        <span className="text-sm text-gray-400 mb-1">Respuesta correcta</span>
                                                        <span className="text-xl font-bold text-yellow-400">{currentReviewQ.answer}</span>
                                                    </div>
                                                </div>

                                                {/* Justification */}
                                                {currentReviewQ.justification && (
                                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-blue-200 text-center animate-in fade-in delay-200">
                                                        <span className="font-bold mr-2">ℹ️ Explicación:</span>
                                                        {currentReviewQ.justification}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Navigation Footer */}
                                <div className="p-6 border-t border-white/10 bg-slate-800 rounded-b-2xl flex justify-between items-center">
                                    <button
                                        onClick={() => setReviewIndex(prev => Math.max(0, prev - 1))}
                                        disabled={reviewIndex === 0}
                                        className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white flex items-center gap-2"
                                    >
                                        ← Anterior
                                    </button>

                                    <div className="flex gap-1">
                                        {reviewableQuestions.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "w-2 h-2 rounded-full transition-all",
                                                    idx === reviewIndex ? "bg-blue-500 w-4" : "bg-white/20"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setReviewIndex(prev => Math.min(reviewableQuestions.length - 1, prev + 1))}
                                        disabled={reviewIndex === reviewableQuestions.length - 1}
                                        className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white flex items-center gap-2"
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Safety check if question undefined
    if (!currentQuestion) return null;

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
                    const isDisabled = q.disabled;

                    return (
                        <div
                            key={q.letter}
                            className={cn(
                                "absolute w-14 h-14 -ml-7 -mt-7 rounded-full flex items-center justify-center text-2xl font-bold border-2 transition-all duration-300",
                                isCurrent ? "scale-125 z-10 shadow-[0_0_15px_rgba(59,130,246,0.8)]" : "scale-100",
                                isDisabled ? "bg-slate-800/50 border-slate-700 text-gray-700 cursor-not-allowed" : // Disabled Style
                                    status === 'correct' ? "bg-green-500 border-green-400 text-white" :
                                        status === 'incorrect' ? "bg-red-500 border-red-400 text-white" :
                                            status === 'pasapalabra' ? "bg-yellow-500 border-yellow-400 text-black" :
                                                isCurrent ? "bg-blue-600 border-blue-400 text-white" :
                                                    "bg-slate-800 border-slate-600 text-gray-400"
                            )}
                            style={{ left: x, top: y }}
                        >
                            {isDisabled ? <X className="w-8 h-8 opacity-50" /> : q.letter}
                        </div>
                    );
                })}

                {/* Center Info */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className="text-8xl font-black text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] filter">
                            {currentQuestion?.letter}
                        </div>
                        <div className="text-lg font-bold text-blue-200 bg-blue-900/60 backdrop-blur px-6 py-2 rounded-full inline-block border border-blue-500/30">
                            {currentQuestion?.startsWith ? 'Empieza por' : 'Contiene'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <div className="w-full max-w-3xl flex-1 flex flex-col justify-end pb-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6 relative overflow-hidden min-h-[140px] flex items-center justify-center shadow-xl">
                    <p className="text-xl md:text-2xl text-center leading-relaxed font-medium">
                        {currentQuestion?.question}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                    <form onSubmit={handleAnswer} className="flex-1 flex gap-4">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-500 transition-all font-medium"
                            autoComplete="off"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!userAnswer.trim()}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-8 rounded-xl font-bold transition-all flex items-center gap-2 transform active:scale-95 shadow-lg shadow-blue-600/20"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={handlePasapalabra}
                        className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-400 px-8 rounded-xl font-bold transition-all flex items-center gap-2 transform active:scale-95 shadow-lg shadow-yellow-600/10"
                    >
                        <SkipForward className="w-6 h-6" />
                        <span className="hidden sm:inline">PASAPALABRA</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
