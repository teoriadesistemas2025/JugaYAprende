'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { Target, X, Ship, Bomb, Waves, Skull, Trophy, Check, Castle } from 'lucide-react';

interface BattleshipGameProps {
    data: any;
    player: string;
    code: string;
    onFinish: (score: number) => void;
    onScoreUpdate?: (score: number) => void;
}

interface Cell {
    x: number;
    y: number;
    status: 'unknown' | 'hit' | 'miss';
    hasShip: boolean;
    shipIndex?: number;
}

// Explosion Component
const Explosion = () => (
    <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1.5, 2], opacity: [1, 1, 0] }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
    >
        <div className="w-full h-full bg-orange-500 rounded-full blur-sm" />
        <div className="absolute w-[80%] h-[80%] bg-yellow-400 rounded-full blur-md" />
        <div className="absolute w-[50%] h-[50%] bg-white rounded-full" />
    </motion.div>
);

// Splash Component
const Splash = () => (
    <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 border-2 border-white rounded-full z-20"
    />
);

// Ship Explosion Component
const ShipExplosion = ({ ship, grid }: { ship: any, grid: Cell[][] }) => {
    const isH = ship.orientation === 'H';
    return (
        <>
            {Array.from({ length: ship.size }).map((_, i) => {
                const cx = isH ? ship.x + i : ship.x;
                const cy = isH ? ship.y : ship.y + i;
                return (
                    <motion.div
                        key={`exp-${cx}-${cy}`}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: [0, 2, 2.5], opacity: [1, 1, 0] }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="absolute pointer-events-none z-30"
                        style={{
                            left: `${cx * 10}%`,
                            top: `${cy * 10}%`,
                            width: '10%',
                            height: '10%'
                        }}
                    >
                        <div className="w-full h-full bg-orange-500 rounded-full blur-md" />
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg animate-pulse" />
                    </motion.div>
                );
            })}
        </>
    );
};

export default function BattleshipGame({ data, player, onFinish, onScoreUpdate }: BattleshipGameProps) {
    const config = data.config.questions;
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [score, setScore] = useState(0);
    const [activeCell, setActiveCell] = useState<{ x: number, y: number } | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<{ question: string, answer: string, type?: 'TEXT' | 'CHOICE', options?: string[] } | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [isFiring, setIsFiring] = useState(false);
    const [sunkShipMessage, setSunkShipMessage] = useState<string | null>(null);
    const [sunkShip, setSunkShip] = useState<any>(null);

    const [timeLeft, setTimeLeft] = useState<number>(config.timeLimit || 300);
    const [gameActive, setGameActive] = useState(true);
    const [finished, setFinished] = useState(false);
    const [finishReason, setFinishReason] = useState<'WIN' | 'TIMEOUT' | 'ABANDON' | null>(null);
    const [history, setHistory] = useState<{ question: string, userAnswer: string, correct: boolean, correctAnswer: string }[]>([]);
    const [viewingHistory, setViewingHistory] = useState(false);

    useEffect(() => {
        if (grid.length === 0) {
            initializeGame();
        }
    }, [config]);

    // Timer Sync Logic
    useEffect(() => {
        if (!data.startTime || finished) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const start = new Date(data.startTime).getTime();
            const elapsed = Math.floor((now - start) / 1000);
            const limit = config.timeLimit || 300;
            const remaining = Math.max(0, limit - elapsed);

            setTimeLeft(remaining);

            if (remaining <= 0) {
                setGameActive(false);
                setFinished(true);
                setFinishReason('TIMEOUT');
                onFinish(score);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [data.startTime, finished, score, config.timeLimit, onFinish]);

    // Sync score updates
    useEffect(() => {
        if (onScoreUpdate) {
            onScoreUpdate(score);
        }
    }, [score, onScoreUpdate]);

    const initializeGame = () => {
        const newGrid: Cell[][] = Array(10).fill(null).map((_, y) =>
            Array(10).fill(null).map((_, x) => {
                const shipIndex = (config.ships || []).findIndex((s: any) => {
                    if (s.orientation === 'H') {
                        return y === s.y && x >= s.x && x < s.x + s.size;
                    } else {
                        return x === s.x && y >= s.y && y < s.y + s.size;
                    }
                });

                return {
                    x,
                    y,
                    status: 'unknown',
                    hasShip: shipIndex !== -1,
                    shipIndex: shipIndex !== -1 ? shipIndex : undefined
                };
            })
        );
        setGrid(newGrid);

        // Restore score if available
        const myPlayer = data.players.find((p: any) => p.name === player);
        if (myPlayer) {
            setScore(myPlayer.score || 0);
            if (myPlayer.finished) {
                setFinished(true);
                setGameActive(false);
                // If checking score for WIN/LOSS is hard from just score, default to TIMEOUT unless score is high?
                // Actually if restored, we might not know reason easily unless stored.
                // For now, assume TIMEOUT if not explicit. Or check if score includes win bonus?
                // Let's leave null or assume finished.
            }
        }
    };

    const handleCellClick = (x: number, y: number) => {
        if (!gameActive || grid[y][x].status !== 'unknown') return;

        const randomQ = config.pool[Math.floor(Math.random() * config.pool.length)];
        setCurrentQuestion(randomQ);
        setActiveCell({ x, y });
        setUserAnswer('');
        setFeedback(null);
    };

    const handleAnswerSubmit = (answer: string) => {
        if (!currentQuestion || !activeCell) return;

        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const isCorrect = normalize(answer) === normalize(currentQuestion.answer);

        setFeedback(isCorrect ? 'correct' : 'incorrect');
        setHistory(prev => [...prev, {
            question: currentQuestion.question,
            userAnswer: answer,
            correct: isCorrect,
            correctAnswer: currentQuestion.answer
        }]);
        setIsFiring(true);

        setTimeout(() => {
            const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
            const cell = newGrid[activeCell.y][activeCell.x];
            let hit = false;

            if (isCorrect) {
                if (cell.hasShip) {
                    cell.status = 'hit';
                    setScore(prev => prev + 100);
                    confetti({ particleCount: 50, spread: 30, origin: { y: 0.5 } });
                    hit = true;

                    if (cell.shipIndex !== undefined) {
                        const ship = config.ships[cell.shipIndex];
                        const shipCells = [];
                        for (let i = 0; i < ship.size; i++) {
                            if (ship.orientation === 'H') shipCells.push(newGrid[ship.y][ship.x + i]);
                            else shipCells.push(newGrid[ship.y + i][ship.x]);
                        }

                        const allHit = shipCells.every(c => c.status === 'hit');
                        if (allHit) {
                            setSunkShipMessage('¡BARCO CAÍDO!');
                            setSunkShip(ship);
                            setScore(prev => prev + 500);
                            setTimeout(() => {
                                setSunkShipMessage(null);
                                setSunkShip(null);
                            }, 3000);
                        }
                    }

                } else {
                    cell.status = 'miss';
                    setScore(prev => Math.max(0, prev - 10));
                }
            } else {
                // Incorrect answer: Do NOT reveal cell status
                setScore(prev => Math.max(0, prev - 20));
            }

            setGrid(newGrid);
            setCurrentQuestion(null);
            setActiveCell(null);
            setFeedback(null);
            setIsFiring(false);

            const totalShipSegments = config.ships.reduce((acc: number, s: any) => acc + s.size, 0);
            const totalHits = newGrid.flat().filter(c => c.status === 'hit').length;

            if (totalHits === totalShipSegments) {
                setFinished(true);
                setGameActive(false);
                setFinishReason('WIN');
                onFinish(score + 1000);
            }

        }, 2000);
    };

    if (finished) {
        if (viewingHistory) {
            return (
                <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Target className="w-6 h-6 text-cyan-400" /> Historial de Disparos
                            </h2>
                            <button
                                onClick={() => setViewingHistory(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="overflow-y-auto space-y-4 pr-2 flex-1">
                            {config.pool.map((q: any, i: number) => {
                                const historyEntry = history.find(h => h.question === q.question);
                                const isAnswered = !!historyEntry;
                                const isCorrect = historyEntry?.correct;

                                return (
                                    <div key={i} className="bg-slate-700/50 p-4 rounded-xl border border-white/5 space-y-3">
                                        <div className="flex justify-between items-start gap-4">
                                            <p className="text-white font-medium text-lg">{q.question}</p>
                                            {isAnswered ? (
                                                <div className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1",
                                                    isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                                )}>
                                                    {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                    {isCorrect ? 'Correcta' : 'Incorrecta'}
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1 rounded-full bg-gray-600/50 text-gray-400 text-xs font-bold shrink-0">
                                                    No respondida
                                                </div>
                                            )}
                                        </div>

                                        {q.type === 'CHOICE' && q.options ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                                {q.options.map((opt: string, optIdx: number) => {
                                                    const isSelected = historyEntry?.userAnswer === opt;
                                                    const isCorrectOpt = opt === q.answer;

                                                    // Determine style
                                                    let styleClass = "bg-slate-800 border-slate-600 text-slate-300";
                                                    if (isCorrectOpt) styleClass = "bg-green-900/40 border-green-500 text-green-300 ring-1 ring-green-500/50";
                                                    else if (isSelected && !isCorrectOpt) styleClass = "bg-red-900/40 border-red-500 text-red-300";
                                                    else if (isSelected) styleClass = "bg-slate-600 border-slate-400 text-white"; // Fallback usually covered by first case if correct

                                                    return (
                                                        <div key={optIdx} className={cn(
                                                            "p-3 rounded-lg border text-sm transition-colors",
                                                            styleClass
                                                        )}>
                                                            <div className="flex justify-between items-center">
                                                                <span>{opt}</span>
                                                                {isCorrectOpt && <Check className="w-4 h-4 text-green-400" />}
                                                                {isSelected && !isCorrectOpt && <X className="w-4 h-4 text-red-400" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="bg-slate-900/50 p-3 rounded-lg text-sm space-y-2 border border-white/5">
                                                {isAnswered ? (
                                                    <>
                                                        <div className="flex flex-col">
                                                            <span className={cn("text-xs mb-1", isCorrect ? "text-green-400" : "text-red-400")}>Tu respuesta:</span>
                                                            <span className="text-white font-mono">{historyEntry.userAnswer}</span>
                                                        </div>
                                                        {!isCorrect && (
                                                            <div className="flex flex-col pt-2 border-t border-white/5">
                                                                <span className="text-xs text-green-400 mb-1">Respuesta correcta:</span>
                                                                <span className="text-white font-mono">{q.answer}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-green-400 mb-1">Respuesta correcta:</span>
                                                        <span className="text-white font-mono">{q.answer}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setViewingHistory(false)}
                                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors"
                            >
                                Volver al Podio
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const sortedPlayers = [...data.players].sort((a: any, b: any) => b.score - a.score);
        const top3 = sortedPlayers.slice(0, 3);
        const myRankIndex = sortedPlayers.findIndex((p: any) => p.name === player);
        const myPlayerObj = sortedPlayers[myRankIndex];
        const amIInTop3 = myRankIndex !== -1 && myRankIndex < 3;

        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
                <div className="max-w-4xl w-full bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 text-center animate-in zoom-in duration-500 shadow-2xl">

                    <div className="mb-8">
                        {finishReason === 'WIN' ? (
                            <div className="inline-block p-4 rounded-full bg-yellow-500/20 mb-4 animate-bounce">
                                <Trophy className="w-16 h-16 text-yellow-400" />
                            </div>
                        ) : (
                            <div className="relative w-64 h-32 mx-auto mb-6 flex justify-between items-end overflow-hidden">
                                {/* Water */}
                                <div className="absolute bottom-0 w-full h-8 bg-blue-500/20 rounded-full blur-md" />

                                {/* Ship */}
                                <motion.div
                                    animate={{
                                        y: [0, -3, 0, 0],
                                        rotate: [-1, 1, -1, 0],
                                        x: [0, 0, 0, 88] // Ends in center
                                    }}
                                    transition={{
                                        duration: 6,
                                        times: [0, 0.3, 0.5, 1],
                                        ease: "easeInOut"
                                    }}
                                    className="relative z-10 -ml-2"
                                >
                                    <Ship className="w-20 h-20 text-gray-300 fill-gray-700/50" strokeWidth={1.5} />
                                </motion.div>

                                {/* Cannonball */}
                                <motion.div
                                    initial={{ x: 40, y: -40, scale: 0, opacity: 0 }}
                                    animate={{
                                        x: [40, 150],
                                        y: [-40, -40],
                                        scale: [1, 1],
                                        opacity: [1, 1, 0]
                                    }}
                                    transition={{ duration: 1.5 }}
                                    className="absolute left-0 bottom-10 z-20"
                                >
                                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]" />
                                </motion.div>

                                {/* Castle / Palace */}
                                <motion.div
                                    initial={{ y: 0, opacity: 1, rotate: 0 }}
                                    animate={{
                                        y: [0, 0, 10, 20],
                                        opacity: [1, 1, 0.5, 0],
                                        rotate: [0, 0, 5, 10]
                                    }}
                                    transition={{ duration: 2, times: [0, 0.5, 0.7, 1], delay: 1.5 }}
                                    className="relative z-10 mr-4 text-purple-300"
                                >
                                    <Castle className="w-20 h-20 fill-purple-900/30" strokeWidth={1.5} />
                                    {/* Explosion Impact */}
                                    <motion.div
                                        animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-full h-full"
                                    >
                                        <div className="absolute inset-0 bg-orange-500 blur-lg rounded-full opacity-50" />
                                    </motion.div>
                                </motion.div>
                            </div>
                        )}

                        <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight uppercase">
                            {finishReason === 'WIN' ? '¡Misión Cumplida!' : '¡Tiempo Agotado!'}
                        </h1>
                        <p className={cn(
                            "text-xl font-medium",
                            finishReason === 'WIN' ? "text-yellow-400" : "text-red-400"
                        )}>
                            {finishReason === 'WIN'
                                ? 'Has hundido toda la flota enemiga'
                                : 'No lograste eliminar la amenaza a tiempo'}
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
                                    <span className="font-mono font-bold text-white bg-black/30 px-2 rounded">{top3[1].score}</span>
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
                                    <span className="font-mono font-bold text-white bg-black/30 px-3 py-1 rounded text-lg">{top3[0].score}</span>
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {top3[2] && (
                            <div className="flex flex-col items-center w-1/3 animate-in slide-in-from-bottom duration-700 delay-200">
                                <span className="text-orange-300 font-bold mb-2 truncate max-w-full text-sm md:text-base">{top3[2].name}</span>
                                <div className="w-full bg-orange-700 h-24 rounded-t-lg flex flex-col items-center justify-between p-2 border-t-4 border-orange-400 relative">
                                    <span className="text-4xl font-black text-white/20 absolute bottom-0">3</span>
                                    <span className="font-mono font-bold text-white bg-black/30 px-2 rounded">{top3[2].score}</span>
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

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setViewingHistory(true)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/40 flex items-center gap-2"
                        >
                            Ver mis respuestas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
            <div className="max-w-4xl w-full flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Ship className="w-6 h-6 text-blue-400" /> Batalla Naval
                    </h2>
                    <div className="flex gap-4">
                        <div className={cn(
                            "px-4 py-2 rounded-lg border border-white/10 font-mono font-bold text-xl flex items-center gap-2",
                            timeLeft < 30 ? "bg-red-900/50 text-red-400 animate-pulse" : "bg-white/10 text-white"
                        )}>
                            <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/10">
                            <span className="text-gray-400 text-sm block">Puntaje</span>
                            <span className="text-xl font-bold text-cyan-400">{score}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-950/50 p-4 rounded-xl border border-blue-500/30 relative shadow-2xl shadow-blue-900/20">
                    <AnimatePresence>
                        {sunkShip && <ShipExplosion ship={sunkShip} grid={grid} />}
                    </AnimatePresence>

                    <AnimatePresence>
                        {sunkShipMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-xl font-black text-3xl shadow-2xl border-4 border-red-400 flex items-center gap-4"
                            >
                                <Skull className="w-10 h-10 animate-bounce" />
                                {sunkShipMessage}
                                <Skull className="w-10 h-10 animate-bounce" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex mb-2 ml-8">
                        {Array(10).fill(0).map((_, i) => (
                            <div key={i} className="flex-1 text-center text-xs text-blue-400 font-mono">
                                {String.fromCharCode(65 + i)}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        <div className="flex flex-col mr-2 justify-around text-xs text-blue-400 font-mono">
                            {Array(10).fill(0).map((_, i) => (
                                <div key={i}>{i + 1}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-10 gap-1 bg-blue-900/20 p-1 rounded border border-blue-500/20">
                            {grid.map((row, y) => (
                                row.map((cell, x) => (
                                    <div
                                        key={`${x}-${y}`}
                                        onClick={() => handleCellClick(x, y)}
                                        className={cn(
                                            "w-8 h-8 md:w-10 md:h-10 rounded-sm cursor-pointer transition-all flex items-center justify-center relative overflow-hidden",
                                            cell.status === 'unknown' ? "bg-blue-800/40 hover:bg-blue-700/60 border border-white/5" :
                                                cell.status === 'hit' ? "bg-red-600 border border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)]" :
                                                    "bg-gray-800/80 border border-gray-600"
                                        )}
                                    >
                                        <AnimatePresence>
                                            {cell.status === 'hit' && (
                                                <motion.div
                                                    key="bomb-icon"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="z-10"
                                                >
                                                    <Bomb className="w-6 h-6 text-white animate-pulse" />
                                                </motion.div>
                                            )}
                                            {cell.status === 'miss' && (
                                                <motion.div
                                                    key="miss-icon"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="z-10"
                                                >
                                                    <X className="w-6 h-6 text-gray-400" strokeWidth={3} />
                                                </motion.div>
                                            )}
                                            {cell.status === 'hit' && <Explosion key="explosion" />}
                                            {cell.status === 'miss' && <Splash key="splash" />}
                                        </AnimatePresence>
                                    </div>
                                ))
                            ))}
                        </div>
                    </div>

                    <AnimatePresence>
                        {currentQuestion && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-xl flex items-center justify-center p-6 z-30"
                            >
                                <div className="w-full max-w-md space-y-6 text-center">
                                    <div className="mb-4">
                                        <span className="text-blue-400 text-sm font-mono tracking-widest uppercase">Coordenada {String.fromCharCode(65 + (activeCell?.x || 0))}{activeCell ? activeCell.y + 1 : ''}</span>
                                        <h3 className="text-2xl font-bold text-white mt-2 leading-tight">{currentQuestion.question}</h3>
                                    </div>

                                    {feedback ? (
                                        <div className="space-y-4">
                                            <div className={cn(
                                                "text-3xl font-bold animate-bounce",
                                                feedback === 'correct' ? "text-green-400" : "text-red-400"
                                            )}>
                                                {feedback === 'correct' ? '¡RESPUESTA CORRECTA!' : '¡RESPUESTA INCORRECTA!'}
                                            </div>
                                            {isFiring && (
                                                <div className="text-yellow-400 font-mono animate-pulse">
                                                    DISPARANDO CAÑONES...
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {currentQuestion.type === 'CHOICE' && currentQuestion.options ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {currentQuestion.options.map((opt, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleAnswerSubmit(opt)}
                                                            className="bg-white/10 hover:bg-cyan-600/50 border border-white/20 hover:border-cyan-400 text-white p-4 rounded-xl transition-all text-lg font-medium"
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={userAnswer}
                                                        onChange={(e) => setUserAnswer(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAnswerSubmit(userAnswer)}
                                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white text-center text-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                                        placeholder="Escribe tu respuesta..."
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleAnswerSubmit(userAnswer)}
                                                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-cyan-900/20"
                                                    >
                                                        FUEGO
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
