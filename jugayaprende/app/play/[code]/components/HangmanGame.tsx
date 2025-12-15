'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { Trophy, Users, Loader2 } from 'lucide-react';

interface HangmanGameProps {
    data: any; // Full game data
    player: string;
    code: string;
    onFinish: (score: number) => void;
    onScoreUpdate?: (score: number) => void;
}

const MAX_MISTAKES = 6;

export default function HangmanGame({ data, player, code, onFinish, onScoreUpdate }: HangmanGameProps) {
    const { config, players } = data;
    const word = (config.questions.word || '').toUpperCase();

    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
    const [mistakes, setMistakes] = useState(0);
    const [status, setStatus] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [score, setScore] = useState(0);

    // Hints Logic
    const hints = config.questions.hints || (config.questions.hint ? [config.questions.hint] : []);
    // Show one hint per mistake made
    const visibleHints = hints.slice(0, mistakes);

    // Timer Logic
    const timeLimit = config.questions.timeLimit || 300; // Default 300s
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    useEffect(() => {
        if (status !== 'PLAYING') return;

        const timer = setInterval(() => {
            setTimeLeft((prev: number) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishGame('LOST');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status]);

    // Check win/loss condition
    useEffect(() => {
        if (status !== 'PLAYING') return;

        const isWon = word.split('').every((char: string) => guessedLetters.has(char) || char === ' ');
        if (isWon) {
            finishGame('WON');
        } else if (mistakes >= MAX_MISTAKES) {
            finishGame('LOST');
        }
    }, [guessedLetters, mistakes, status, word]);

    const finishGame = (result: 'WON' | 'LOST') => {
        setStatus(result);
        if (!hasSubmitted) {
            setHasSubmitted(true);

            let finalScore = score;
            if (result === 'WON') {
                const timeBonus = timeLeft * 10; // 10 pts per second left
                const winBonus = 500;
                finalScore += timeBonus + winBonus;
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }

            onFinish(finalScore);
        }
    };

    const handleGuess = (letter: string) => {
        if (status !== 'PLAYING' || guessedLetters.has(letter)) return;

        const newGuessed = new Set(guessedLetters);
        newGuessed.add(letter);
        setGuessedLetters(newGuessed);

        if (word.includes(letter)) {
            // Calculate points: 50 per occurrence
            const count = word.split('').filter((char: string) => char === letter).length;
            const points = count * 50;
            const newScore = score + points;
            setScore(newScore);
            if (onScoreUpdate) onScoreUpdate(newScore);
        } else {
            setMistakes(prev => prev + 1);
        }
    };

    // Keyboard layout
    const keyboard = [
        'QWERTYUIOP',
        'ASDFGHJKLÑ',
        'ZXCVBNM'
    ];

    // Improved SVG Parts
    const drawPart = (index: number) => {
        const strokeColor = "white";
        const strokeWidth = "4";
        const props = { stroke: strokeColor, strokeWidth, strokeLinecap: "round" as const, fill: "transparent" };

        switch (index) {
            case 1: // Head (Cute style)
                return (
                    <g>
                        <circle cx="150" cy="90" r="25" {...props} />
                        {status === 'LOST' && (
                            <>
                                <path d="M140 85 L146 91 M146 85 L140 91" stroke="white" strokeWidth="2" />
                                <path d="M154 85 L160 91 M160 85 L154 91" stroke="white" strokeWidth="2" />
                                <path d="M145 100 Q150 95 155 100" stroke="white" strokeWidth="2" fill="none" />
                            </>
                        )}
                        {status === 'WON' && (
                            <>
                                <circle cx="142" cy="88" r="2" fill="white" />
                                <circle cx="158" cy="88" r="2" fill="white" />
                                <path d="M145 100 Q150 105 155 100" stroke="white" strokeWidth="2" fill="none" />
                            </>
                        )}
                    </g>
                );
            case 2: return <line x1="150" y1="115" x2="150" y2="190" {...props} />; // Body
            case 3: return <line x1="150" y1="130" x2="120" y2="160" {...props} />; // L Arm
            case 4: return <line x1="150" y1="130" x2="180" y2="160" {...props} />; // R Arm
            case 5: return <line x1="150" y1="190" x2="130" y2="240" {...props} />; // L Leg
            case 6: return <line x1="150" y1="190" x2="170" y2="240" {...props} />; // R Leg
            default: return null;
        }
    };

    // --- VIEW: GAME OVER (Won/Lost/Waiting) ---
    if (status !== 'PLAYING') {
        const sortedPlayers = [...players].sort((a: any, b: any) => b.score - a.score);
        const top3 = sortedPlayers.slice(0, 3);
        const myPlayerObj = players.find((p: any) => p.name === player);
        const myRankIndex = sortedPlayers.findIndex((p: any) => p.name === player);
        const amIInTop3 = myRankIndex < 3 && myRankIndex !== -1;

        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">
                <div className="max-w-4xl w-full bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-2xl relative">
                    {/* Confetti if won */}
                    {status === 'WON' && <div className="absolute inset-0 overflow-hidden pointer-events-none" />}

                    {/* Result Header */}
                    <div className="text-center mb-8">
                        <h1 className={cn(
                            "text-5xl font-black mb-2 animate-bounce",
                            status === 'WON' ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        )}>
                            {status === 'WON' ? '¡GANASTE!' : '¡TIEMPO AGOTADO!'}
                        </h1>
                        <p className={cn(
                            "text-xl font-medium",
                            status === 'WON' ? "text-yellow-200" : "text-red-400"
                        )}>
                            {status === 'WON'
                                ? '¡Has descubierto la palabra secreta!'
                                : 'No lograste adivinar la palabra a tiempo'}
                        </p>
                    </div>

                    {/* Podium */}
                    <div className="flex justify-center items-end gap-4 mb-12 h-64">
                        {/* 2nd Place */}
                        {top3[1] && (
                            <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom duration-700 delay-100">
                                <span className="text-gray-300 font-bold mb-2 truncate max-w-full text-sm md:text-base">{top3[1].name}</span>
                                <div className="w-full bg-slate-600 h-32 rounded-t-lg flex flex-col items-center justify-between p-2 border-t-4 border-gray-400 relative">
                                    <span className="text-4xl font-black text-white/20 absolute bottom-0">2</span>
                                    <span className="font-mono font-bold text-white bg-black/30 px-2 rounded">{top3[1].score || 0}</span>
                                    {!top3[1].finished && <Loader2 className="w-4 h-4 text-white/50 animate-spin absolute top-2 right-2" />}
                                </div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {top3[0] && (
                            <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom duration-700 z-10">
                                <div className="mb-2 text-yellow-500">
                                    <Trophy className="w-8 h-8 animate-pulse" />
                                </div>
                                <span className="text-yellow-400 font-bold mb-2 truncate max-w-full text-lg md:text-xl transform -translate-y-1">{top3[0].name}</span>
                                <div className="w-full bg-yellow-600 h-48 rounded-t-lg flex flex-col items-center justify-between p-2 border-t-4 border-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.3)] relative">
                                    <span className="text-6xl font-black text-white/20 absolute bottom-0">1</span>
                                    <span className="font-mono font-bold text-white bg-black/30 px-3 py-1 rounded text-lg">{top3[0].score || 0}</span>
                                    {!top3[0].finished && <Loader2 className="w-4 h-4 text-white/50 animate-spin absolute top-2 right-2" />}
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {top3[2] && (
                            <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom duration-700 delay-200">
                                <span className="text-orange-300 font-bold mb-2 truncate max-w-full text-sm md:text-base">{top3[2].name}</span>
                                <div className="w-full bg-orange-700 h-24 rounded-t-lg flex flex-col items-center justify-between p-2 border-t-4 border-orange-400 relative">
                                    <span className="text-4xl font-black text-white/20 absolute bottom-0">3</span>
                                    <span className="font-mono font-bold text-white bg-black/30 px-2 rounded">{top3[2].score || 0}</span>
                                    {!top3[2].finished && <Loader2 className="w-4 h-4 text-white/50 animate-spin absolute top-2 right-2" />}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* My Rank (if not in podium) */}
                    {!amIInTop3 && myPlayerObj && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between mb-8 max-w-md mx-auto">
                            <div className="flex items-center gap-4">
                                <span className="text-gray-400 font-bold text-xl">#{myRankIndex + 1}</span>
                                <div className="text-left">
                                    <p className="text-white font-bold">{myPlayerObj.name}</p>
                                    <p className="text-xs text-gray-400">Tu posición actual</p>
                                </div>
                            </div>
                            <span className="font-mono font-bold text-cyan-400 text-xl">{myPlayerObj.score}</span>
                        </div>
                    )}

                    {/* Reveal Button */}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => setShowDetails(true)}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full border border-white/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            🔍 Ver Solución y Pistas
                        </button>
                    </div>

                    {/* Details Modal/Overlay */}
                    {showDetails && (
                        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕ Cerrar
                                </button>

                                <div className="text-center space-y-8">
                                    <div>
                                        <p className="text-sm text-gray-400 uppercase tracking-widest mb-4">Palabra Oculta</p>
                                        <p className="text-3xl md:text-5xl font-mono font-bold text-white tracking-widest break-words">{typeof word === 'string' ? word : JSON.stringify(word)}</p>
                                    </div>

                                    {Array.isArray(hints) && hints.length > 0 && (
                                        <div className="pt-8 border-t border-white/10">
                                            <p className="text-sm text-gray-400 mb-4">Todas las Pistas</p>
                                            <div className="flex flex-col gap-3">
                                                {hints.map((h: any, i: number) => (
                                                    <div key={i} className="bg-blue-900/20 text-blue-200 px-4 py-3 rounded-lg text-lg border border-blue-500/10">
                                                        💡 {typeof h === 'string' ? h : JSON.stringify(h)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW: PLAYING ---
    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-3xl flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-yellow-400">Ahorcado</h1>

                {/* Timer */}
                <div className={cn(
                    "font-mono text-2xl font-bold px-4 py-1 rounded-lg border",
                    timeLeft <= 30 ? "bg-red-900/50 text-red-400 border-red-500/50 animate-pulse" : "bg-white/10 text-white border-white/10"
                )}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>

                <div className="text-gray-400">Errores: <span className={cn("font-bold", mistakes >= 4 ? "text-red-500" : "text-white")}>{mistakes} / {MAX_MISTAKES}</span></div>
            </div>

            <div className="flex-1 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left: Hangman Drawing */}
                <div className="flex justify-center">
                    <div className="relative w-72 h-80 bg-white/5 rounded-xl border border-white/10 p-4 shadow-2xl">
                        <svg viewBox="0 0 300 300" className="w-full h-full">
                            {/* Base & Pole */}
                            <path d="M50 280 L250 280" stroke="gray" strokeWidth="4" strokeLinecap="round" />
                            <path d="M100 280 L100 40 Q100 20 120 20 L150 20 L150 50" stroke="gray" strokeWidth="4" strokeLinecap="round" fill="none" />

                            {/* Rope */}
                            <line x1="150" y1="50" x2="150" y2="65" stroke="#8B4513" strokeWidth="3" />

                            {/* Body Parts */}
                            {Array.from({ length: mistakes }).map((_, i) => (
                                <g key={i} className="animate-in fade-in duration-500">
                                    {drawPart(i + 1)}
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>

                {/* Right: Word & Keyboard */}
                <div className="flex flex-col items-center gap-8">
                    {/* Hints Container */}
                    <div className="flex flex-col gap-2 w-full max-w-lg h-16 justify-center">
                        {visibleHints.length > 0 ? (
                            <motion.div
                                key={visibleHints.length} // Key changes on new hint, triggering animation
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-blue-900/40 px-4 py-2 rounded-lg text-blue-300 text-sm border border-blue-500/20 text-center shadow-lg"
                            >
                                💡 Pista {visibleHints.length}: {visibleHints[visibleHints.length - 1]}
                            </motion.div>
                        ) : (
                            mistakes === 0 && hints.length > 0 && (
                                <p className="text-gray-500 text-xs text-center italic">Comete un error para obtener pistas...</p>
                            )
                        )}
                    </div>

                    {/* Word Display */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {word.split('').map((char: string, i: number) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className={cn(
                                    "w-10 h-12 flex items-center justify-center text-2xl font-bold border-b-4 transition-all",
                                    char === ' ' ? "border-transparent" : "border-white/30 bg-white/5 rounded-t-lg",
                                    guessedLetters.has(char) ? "text-white" : "text-transparent"
                                )}>
                                    {char}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Keyboard */}
                    <div className="w-full max-w-lg space-y-2">
                        {keyboard.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-center gap-1">
                                {row.split('').map((char) => {
                                    const isGuessed = guessedLetters.has(char);
                                    const isCorrect = word.includes(char);

                                    return (
                                        <button
                                            key={char}
                                            onClick={() => handleGuess(char)}
                                            disabled={isGuessed}
                                            className={cn(
                                                "w-8 h-10 md:w-10 md:h-12 rounded-lg font-bold transition-all text-sm md:text-base shadow-lg",
                                                isGuessed
                                                    ? (isCorrect ? "bg-green-600 text-white opacity-50" : "bg-gray-700 text-gray-500 opacity-30")
                                                    : "bg-gradient-to-b from-white/20 to-white/5 hover:from-white/30 hover:to-white/10 text-white active:scale-95 border border-white/10"
                                            )}
                                        >
                                            {char}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
