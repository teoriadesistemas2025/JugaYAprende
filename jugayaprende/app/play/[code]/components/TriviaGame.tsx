'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface TriviaGameProps {
    data: any;
    player: string;
    code: string;
}

export default function TriviaGame({ data, player, code }: TriviaGameProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [localTimer, setLocalTimer] = useState(20); // Timer for buzzer enable
    const [answerTimer, setAnswerTimer] = useState(0); // Timer for answering

    const { config, triviaState, myScore } = data;
    const questions = Array.isArray(config.questions) ? config.questions : config.questions.questions;
    const currentQ = questions[triviaState?.currentQuestionIndex || 0];

    // Buzzer Logic
    const isBuzzerOpen = triviaState?.buzzerOpen;
    const buzzedPlayer = triviaState?.buzzedPlayer;
    const myQueuePos = triviaState?.buzzQueue?.indexOf(player);
    const isMeInQueue = myQueuePos !== undefined && myQueuePos > -1;
    const isMeBuzzed = buzzedPlayer === player;
    const isMeAttempted = triviaState?.attemptedPlayers?.includes(player);

    // Reset hasAnswered when question changes
    useEffect(() => {
        setHasAnswered(false);
        setSelectedAnswer(null);
    }, [triviaState?.currentQuestionIndex]);

    // Sync timer with server timestamp
    useEffect(() => {
        if (triviaState?.buzzerEnableTime) {
            const enableTime = new Date(triviaState.buzzerEnableTime).getTime();
            const now = Date.now();
            const diff = Math.ceil((enableTime - now) / 1000);
            setLocalTimer(Math.max(0, diff));
        } else {
            setLocalTimer(0);
        }
    }, [triviaState?.buzzerEnableTime]);

    // Local countdown tick
    useEffect(() => {
        if (localTimer > 0) {
            const timer = setInterval(() => setLocalTimer(t => Math.max(0, t - 1)), 1000);
            return () => clearInterval(timer);
        }
    }, [localTimer]);

    // Answer timer sync
    useEffect(() => {
        if (triviaState?.answerDeadline && isMeBuzzed) {
            const deadline = new Date(triviaState.answerDeadline).getTime();
            const now = Date.now();
            const diff = Math.ceil((deadline - now) / 1000);
            setAnswerTimer(Math.max(0, diff));
        } else {
            setAnswerTimer(0);
        }
    }, [triviaState?.answerDeadline, isMeBuzzed]);

    // Define handleTimeout before the useEffect that uses it
    const handleTimeout = useCallback(async () => {
        if (hasAnswered) return;
        setHasAnswered(true);

        // Submit timeout as wrong answer
        try {
            await fetch(`/api/games/${code}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player,
                    action: 'TRIVIA_TIMEOUT'
                })
            });
        } catch (err) {
            console.error(err);
        }
    }, [code, player]);

    // Answer timer countdown
    useEffect(() => {
        if (answerTimer > 0 && isMeBuzzed) {
            const timer = setInterval(() => {
                setAnswerTimer(t => {
                    if (t <= 1) {
                        // Time's up! Auto-submit timeout
                        handleTimeout();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [answerTimer, isMeBuzzed, handleTimeout]);

    // Check if buzzer is enabled by time
    const isTimerPassed = triviaState?.buzzerEnableTime && Date.now() >= new Date(triviaState.buzzerEnableTime).getTime();
    const canBuzz = isBuzzerOpen || isTimerPassed || (!buzzedPlayer && isTimerPassed);

    const handleBuzz = async () => {
        if (isMeInQueue || isMeAttempted) return;

        try {
            await fetch(`/api/games/${code}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player,
                    action: 'BUZZ'
                })
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleAnswer = async (answer: string) => {
        if (hasAnswered) return;
        setSelectedAnswer(answer);
        setHasAnswered(true);

        const isCorrect = answer === currentQ.options[0]; // First option is always correct in data

        if (isCorrect) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        try {
            await fetch(`/api/games/${code}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player,
                    action: 'TRIVIA_ANSWER',
                    answer
                })
            });
        } catch (err) {
            console.error(err);
        }
    };

    // Game Over Screen
    if (!currentQ) {
        const [showReview, setShowReview] = useState(false);
        const [reviewIndex, setReviewIndex] = useState(0);

        // Sort players by score
        const sortedPlayers = [...data.players].sort((a: any, b: any) => b.score - a.score);
        const top3 = sortedPlayers.slice(0, 3);
        const myPlayerObj = sortedPlayers.find((p: any) => p.name === player);
        const myPosition = sortedPlayers.findIndex((p: any) => p.name === player) + 1;
        const amIInTop3 = myPosition <= 3;

        const reviewableQuestions = questions.filter((q: any) => q);
        const currentReviewQ = reviewableQuestions[reviewIndex];

        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">¡JUEGO TERMINADO!</h1>

                {/* Podium */}
                <div className="flex items-end justify-center gap-4 mb-8 w-full max-w-3xl">
                    {/* 2nd Place */}
                    {top3[1] && (
                        <div className="flex flex-col items-center flex-1">
                            <div className="bg-slate-700 rounded-t-xl p-4 w-full text-center border-2 border-slate-600">
                                <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl font-bold">{top3[1].name.charAt(0).toUpperCase()}</span>
                                </div>
                                <p className="font-bold truncate">{top3[1].name}</p>
                                <div className="bg-slate-800 rounded-full px-3 py-1 mt-2 inline-block">
                                    <span className="text-yellow-400 font-bold">{top3[1].score}</span>
                                </div>
                            </div>
                            <div className="bg-slate-700 w-full h-24 flex items-center justify-center rounded-b-xl border-2 border-t-0 border-slate-600">
                                <span className="text-4xl font-bold text-slate-400">2</span>
                            </div>
                        </div>
                    )}

                    {/* 1st Place */}
                    {top3[0] && (
                        <div className="flex flex-col items-center flex-1">
                            <div className="text-yellow-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                            <div className="bg-yellow-600 rounded-t-xl p-4 w-full text-center border-2 border-yellow-500">
                                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl font-bold text-yellow-900">{top3[0].name.charAt(0).toUpperCase()}</span>
                                </div>
                                <p className="font-bold truncate text-yellow-900">{top3[0].name}</p>
                                <div className="bg-yellow-700 rounded-full px-3 py-1 mt-2 inline-block">
                                    <span className="text-yellow-100 font-bold">{top3[0].score}</span>
                                </div>
                            </div>
                            <div className="bg-yellow-600 w-full h-32 flex items-center justify-center rounded-b-xl border-2 border-t-0 border-yellow-500">
                                <span className="text-5xl font-bold text-yellow-900">1</span>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {top3[2] && (
                        <div className="flex flex-col items-center flex-1">
                            <div className="bg-orange-700 rounded-t-xl p-4 w-full text-center border-2 border-orange-600">
                                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl font-bold">{top3[2].name.charAt(0).toUpperCase()}</span>
                                </div>
                                <p className="font-bold truncate">{top3[2].name}</p>
                                <div className="bg-orange-800 rounded-full px-3 py-1 mt-2 inline-block">
                                    <span className="text-yellow-400 font-bold">{top3[2].score}</span>
                                </div>
                            </div>
                            <div className="bg-orange-700 w-full h-20 flex items-center justify-center rounded-b-xl border-2 border-t-0 border-orange-600">
                                <span className="text-3xl font-bold text-orange-900">3</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* My Position (if not in top 3) */}
                {!amIInTop3 && myPlayerObj && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 max-w-md w-full">
                        <p className="text-center text-gray-400 mb-2">Tu posición</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="font-bold">{player.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="font-bold">{player}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold text-yellow-400">{myPlayerObj.score}</span>
                                <span className="text-3xl font-bold text-gray-500">#{myPosition}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Ranking - Only visible to host */}
                {data.isHost && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6 max-w-2xl w-full">
                        <h3 className="text-xl font-bold mb-4 text-center">Ranking Completo</h3>
                        <div className="space-y-2">
                            {sortedPlayers.map((p: any, index: number) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-lg ${p.name === player
                                        ? 'bg-blue-600/20 border-2 border-blue-500'
                                        : 'bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-2xl font-bold w-8 ${index === 0 ? 'text-yellow-400' :
                                            index === 1 ? 'text-gray-400' :
                                                index === 2 ? 'text-orange-400' :
                                                    'text-gray-500'
                                            }`}>
                                            #{index + 1}
                                        </span>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index === 0 ? 'bg-yellow-600' :
                                            index === 1 ? 'bg-slate-600' :
                                                index === 2 ? 'bg-orange-600' :
                                                    'bg-slate-700'
                                            }`}>
                                            <span className="font-bold">{p.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <span className={`font-bold ${p.name === player ? 'text-blue-400' : ''}`}>
                                            {p.name}
                                        </span>
                                    </div>
                                    <span className="text-2xl font-bold text-yellow-400">{p.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Review Button */}
                <button
                    onClick={() => setShowReview(true)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                >
                    Ver respuestas
                </button>

                {/* Review Modal */}
                {showReview && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Revisión de Respuestas</h2>
                                <button
                                    onClick={() => setShowReview(false)}
                                    className="text-gray-400 hover:text-white text-2xl"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Question Review */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                                    <span>Pregunta {reviewIndex + 1} de {reviewableQuestions.length}</span>
                                </div>

                                <div className="bg-slate-700 rounded-xl p-4 mb-4">
                                    <p className="text-lg font-semibold mb-4">{currentReviewQ.question}</p>

                                    <div className="space-y-2">
                                        {currentReviewQ.options.map((opt: string, i: number) => {
                                            const isCorrect = i === 0; // First option is correct
                                            return (
                                                <div
                                                    key={i}
                                                    className={`p-3 rounded-lg border-2 ${isCorrect
                                                        ? 'bg-green-900/30 border-green-500'
                                                        : 'bg-slate-800 border-slate-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isCorrect && (
                                                            <span className="text-green-400">✓</span>
                                                        )}
                                                        <span className={isCorrect ? 'text-green-400 font-bold' : ''}>
                                                            {opt}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Navigation */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                                        disabled={reviewIndex === 0}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-semibold"
                                    >
                                        ← Anterior
                                    </button>
                                    <button
                                        onClick={() => setReviewIndex(Math.min(reviewableQuestions.length - 1, reviewIndex + 1))}
                                        disabled={reviewIndex === reviewableQuestions.length - 1}
                                        className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-semibold"
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Shuffle options for display only (so A is not always correct visually)
    // We use a simple hash or seed based on question index to keep it consistent if re-rendered
    // But for simplicity here, we'll just map them. Ideally, shuffle on server or use a seed.
    // Since we receive options array, we assume they are already shuffled or we shuffle them here.
    // Wait, the editor saves [Correct, Wrong, Wrong, Wrong]. We MUST shuffle them for display.
    // Let's do a simple shuffle based on question text length to be deterministic-ish without complex state
    const displayOptions = [...(currentQ.options || [])].sort((a, b) => a.localeCompare(b));

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 bg-white/5 p-4 rounded-xl">
                <div className="text-sm text-gray-400">
                    Pregunta {triviaState.currentQuestionIndex + 1} / {questions.length}
                </div>
                <div className="text-xl font-bold text-yellow-400">
                    {myScore} pts
                </div>
            </div>

            {/* Question */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 leading-relaxed">
                    {currentQ.question}
                </h2>

                {/* Game State Views */}

                {/* 1. Waiting to Buzz (Timer running) */}
                {!canBuzz && !buzzedPlayer && localTimer > 0 && (
                    <div className="text-center">
                        <div className="text-6xl font-mono font-bold text-blue-400 mb-4">{localTimer}</div>
                        <p className="text-gray-400 animate-pulse">Prepárate para pulsar...</p>
                    </div>
                )}

                {/* 2. Buzzer Available */}
                {canBuzz && !isMeInQueue && !isMeAttempted && (
                    <button
                        onClick={handleBuzz}
                        className="w-48 h-48 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center animate-bounce"
                    >
                        <span className="text-3xl font-bold">¡PULSAR!</span>
                    </button>
                )}

                {/* 3. In Queue (Waiting) */}
                {isMeInQueue && !isMeBuzzed && (
                    <div className="text-center bg-white/10 p-8 rounded-2xl animate-pulse">
                        <h3 className="text-xl font-bold mb-2">¡Has pulsado!</h3>
                        <p className="text-gray-300">Posición en cola: <span className="text-yellow-400 font-bold text-2xl">{myQueuePos + 1}</span></p>
                        <p className="text-sm text-gray-500 mt-4">Esperando tu turno...</p>
                    </div>
                )}

                {/* 4. My Turn (Answering) */}
                {isMeBuzzed && (
                    <div className="w-full space-y-4 animate-in zoom-in duration-300">
                        <div className="text-center mb-6 flex flex-col items-center gap-2">
                            <span className="bg-green-500 text-black px-4 py-1 rounded-full font-bold text-sm uppercase tracking-wider">
                                ¡Es tu turno!
                            </span>
                            {answerTimer > 0 && (
                                <div className={cn(
                                    "text-4xl font-mono font-bold",
                                    answerTimer <= 5 ? "text-red-400 animate-pulse" : "text-yellow-400"
                                )}>
                                    {answerTimer}s
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {displayOptions.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={hasAnswered}
                                    className={cn(
                                        "p-4 rounded-xl text-left font-medium transition-all border-2",
                                        selectedAnswer === opt
                                            ? "bg-yellow-500 text-black border-yellow-500"
                                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                                    )}
                                >
                                    <span className="inline-block w-6 font-bold opacity-50 mr-2">{String.fromCharCode(65 + i)}.</span>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Someone else answering */}
                {buzzedPlayer && !isMeBuzzed && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                            {buzzedPlayer.charAt(0)}
                        </div>
                        <p className="text-lg">
                            <span className="font-bold text-yellow-400">{buzzedPlayer}</span> está respondiendo...
                        </p>
                    </div>
                )}

                {/* 6. Already Attempted (Wrong) */}
                {isMeAttempted && (
                    <div className="text-center bg-red-900/20 border border-red-500/20 p-6 rounded-xl">
                        <p className="text-red-400 font-bold">Respuesta Incorrecta</p>
                        <p className="text-sm text-gray-400 mt-2">Espera a la siguiente pregunta</p>
                    </div>
                )}
            </div>
        </div>
    );
}
