'use client';

import { useState } from 'react';
import { Save, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ship {
    x: number;
    y: number;
    size: number;
    orientation: 'H' | 'V';
}

interface Question {
    question: string;
    answer: string;
    type: 'TEXT' | 'CHOICE';
    options?: string[];
}

interface BattleshipEditorProps {
    initialData?: {
        title: string;
        ships: Ship[];
        pool: Question[];
    };
    onSave: (data: { title: string, ships: Ship[], pool: Question[] }) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}

export default function BattleshipEditor({ initialData, onSave, onCancel, saving }: BattleshipEditorProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [ships, setShips] = useState<Ship[]>(initialData?.ships || []);
    const [questions, setQuestions] = useState<Question[]>(initialData?.pool || []);

    // Ship Placement State
    const [selectedShipSize, setSelectedShipSize] = useState(5);
    const [orientation, setOrientation] = useState<'H' | 'V'>('H');

    // Question Form State
    const [newQuestion, setNewQuestion] = useState<Question>({
        question: '',
        answer: '',
        type: 'TEXT',
        options: ['', '', '', '']
    });

    const handleSave = () => {
        if (!title.trim() || ships.length < 1 || questions.length < 1) return;
        onSave({ title, ships, pool: questions });
    };

    const addQuestion = () => {
        if (!newQuestion.question.trim() || !newQuestion.answer.trim()) return;

        // Filter empty options if choice
        const finalQuestion = { ...newQuestion };
        if (finalQuestion.type === 'CHOICE') {
            finalQuestion.options = finalQuestion.options?.filter(o => o.trim()) || [];
            if (finalQuestion.options.length < 2) {
                alert('Debe haber al menos 2 opciones para preguntas de opción múltiple');
                return;
            }
            // Ensure answer is one of the options
            if (!finalQuestion.options.includes(finalQuestion.answer)) {
                // If answer matches text but not exact string (case sensitivity etc), maybe warn?
                // For now, let's just add the answer to options if not present? 
                // Or force user to select correct answer from options.
                // Let's assume user types the correct answer exactly as one of the options for now.
            }
        }

        setQuestions([...questions, finalQuestion]);
        setNewQuestion({
            question: '',
            answer: '',
            type: 'TEXT',
            options: ['', '', '', '']
        });
    };

    const handleGridClick = (i: number) => {
        const x = i % 10;
        const y = Math.floor(i / 10);

        // Check bounds
        if (orientation === 'H' && x + selectedShipSize > 10) return;
        if (orientation === 'V' && y + selectedShipSize > 10) return;

        // Check overlap
        const newShip = { x, y, size: selectedShipSize, orientation };
        const hasOverlap = ships.some(s => {
            // Simple bounding box check
            // Expand ships to actual cells
            const sCells: string[] = [];
            for (let k = 0; k < s.size; k++) sCells.push(s.orientation === 'H' ? `${s.x + k},${s.y}` : `${s.x},${s.y + k}`);

            const newCells: string[] = [];
            for (let k = 0; k < newShip.size; k++) newCells.push(newShip.orientation === 'H' ? `${newShip.x + k},${newShip.y}` : `${newShip.x},${newShip.y + k}`);

            return newCells.some(c => sCells.includes(c));
        });

        if (!hasOverlap) {
            setShips([...ships, newShip]);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Volver
                </button>
                <h1 className="text-3xl font-bold text-white">
                    {initialData ? 'Editar Batalla Naval' : 'Crear Batalla Naval'}
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving || !title.trim() || ships.length < 1 || questions.length < 1}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar
                </button>
            </div>

            {/* Title Input */}
            <div className="bg-card border border-white/10 rounded-xl p-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Título del Juego</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="Ej: Batalla Naval de Historia"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grid & Ships */}
                <div className="bg-card border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Posicionar Barcos</h3>
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => setOrientation(prev => prev === 'H' ? 'V' : 'H')}
                            className="bg-white/10 px-4 py-2 rounded-lg text-white text-sm font-bold hover:bg-white/20 transition-colors"
                        >
                            Orientación: {orientation === 'H' ? 'Horizontal' : 'Vertical'}
                        </button>
                        <div className="flex gap-2">
                            {[
                                { size: 5, name: 'Portaaviones' },
                                { size: 4, name: 'Acorazado' },
                                { size: 3, name: 'Crucero' },
                                { size: 3, name: 'Submarino' },
                                { size: 2, name: 'Destructor' }
                            ].map((ship) => (
                                <button
                                    key={ship.name}
                                    onClick={() => setSelectedShipSize(ship.size)}
                                    className={cn(
                                        "w-8 h-8 rounded flex items-center justify-center font-bold text-xs transition-colors",
                                        selectedShipSize === ship.size ? "bg-cyan-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                                    )}
                                    title={ship.name}
                                >
                                    {ship.size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="aspect-square bg-blue-900/20 rounded-lg p-4 relative">
                        <div className="grid grid-cols-10 gap-1 h-full">
                            {Array(100).fill(0).map((_, i) => {
                                const x = i % 10;
                                const y = Math.floor(i / 10);
                                const hasShip = ships.some(s => {
                                    if (s.orientation === 'H') {
                                        return y === s.y && x >= s.x && x < s.x + s.size;
                                    } else {
                                        return x === s.x && y >= s.y && y < s.y + s.size;
                                    }
                                });

                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleGridClick(i)}
                                        className={cn(
                                            "rounded-sm transition-colors cursor-pointer hover:bg-white/10",
                                            hasShip ? "bg-cyan-500" : "bg-blue-900/40"
                                        )}
                                    />
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setShips([])}
                            className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-300 bg-black/50 px-2 py-1 rounded"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* Questions Pool */}
                <div className="bg-card border border-white/10 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-gray-400">Banco de Preguntas ({questions.length})</label>
                        <span className="text-xs text-gray-500">Mínimo 10 recomendadas</span>
                    </div>

                    <div className="space-y-4 mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => setNewQuestion({ ...newQuestion, type: 'TEXT' })}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-sm font-bold transition-colors",
                                    newQuestion.type === 'TEXT' ? "bg-cyan-600 text-white" : "bg-white/5 text-gray-400"
                                )}
                            >
                                Texto
                            </button>
                            <button
                                onClick={() => setNewQuestion({ ...newQuestion, type: 'CHOICE' })}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-sm font-bold transition-colors",
                                    newQuestion.type === 'CHOICE' ? "bg-cyan-600 text-white" : "bg-white/5 text-gray-400"
                                )}
                            >
                                Opción Múltiple
                            </button>
                        </div>

                        <input
                            type="text"
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            placeholder="Pregunta"
                        />

                        {newQuestion.type === 'TEXT' ? (
                            <input
                                type="text"
                                value={newQuestion.answer}
                                onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                placeholder="Respuesta Correcta"
                            />
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Opciones (Marca la correcta)</label>
                                {newQuestion.options?.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="radio"
                                            name="correct-option"
                                            checked={newQuestion.answer === opt && opt !== ''}
                                            onChange={() => setNewQuestion({ ...newQuestion, answer: opt })}
                                            className="accent-cyan-500 mt-3"
                                        />
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...(newQuestion.options || [])];
                                                newOpts[i] = e.target.value;
                                                // If this was the answer, update answer too
                                                const isAnswer = newQuestion.answer === opt;
                                                setNewQuestion({
                                                    ...newQuestion,
                                                    options: newOpts,
                                                    answer: isAnswer ? e.target.value : newQuestion.answer
                                                });
                                            }}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                            placeholder={`Opción ${i + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={addQuestion}
                            disabled={!newQuestion.question.trim() || !newQuestion.answer.trim()}
                            className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Agregar Pregunta
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {questions.map((q, i) => (
                            <div key={i} className="bg-cyan-900/20 border border-cyan-500/20 p-3 rounded-lg flex justify-between group">
                                <div>
                                    <p className="text-white text-sm font-medium">{q.question}</p>
                                    <p className="text-cyan-400 text-xs">
                                        {q.type === 'CHOICE' ? '[Múltiple] ' : ''}{q.answer}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
