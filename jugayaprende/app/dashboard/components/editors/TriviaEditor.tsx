'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, ArrowLeft, Clock } from 'lucide-react';

interface TriviaQuestion {
    question: string;
    answer: string;
    options: string[];
    timeLimit?: number;
}

interface TriviaEditorProps {
    initialData?: {
        title: string;
        questions: TriviaQuestion[];
    };
    onSave: (data: { title: string, questions: TriviaQuestion[] }) => Promise<void>;
    onCancel: () => void;
    saving: boolean;
}

export default function TriviaEditor({ initialData, onSave, onCancel, saving }: TriviaEditorProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [questions, setQuestions] = useState<TriviaQuestion[]>(initialData?.questions || []);
    const [newQuestion, setNewQuestion] = useState<TriviaQuestion>({
        question: '',
        answer: '',
        options: ['', '', '', ''],
        timeLimit: 20
    });
    const [correctIndex, setCorrectIndex] = useState(0);

    const handleSave = () => {
        if (!title.trim() || questions.length < 1) return;
        onSave({ title, questions });
    };

    const addQuestion = () => {
        if (newQuestion.question.trim() && newQuestion.options.every(o => o.trim())) {
            const questionToAdd = {
                ...newQuestion,
                answer: newQuestion.options[correctIndex]
            };
            setQuestions([...questions, questionToAdd]);
            setNewQuestion({
                question: '',
                answer: '',
                options: ['', '', '', ''],
                timeLimit: 20
            });
            setCorrectIndex(0);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Volver
                </button>
                <h1 className="text-3xl font-bold text-white">
                    {initialData ? 'Editar Juego' : 'Crear Juego'}
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving || !title.trim() || questions.length < 1}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="Ej: Cultura General"
                />
            </div>

            {/* Questions Editor */}
            <div className="bg-card border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-400">Preguntas ({questions.length})</label>
                    <span className="text-xs text-gray-500">Mínimo 1 pregunta requerida</span>
                </div>

                <div className="space-y-6 mb-8 bg-white/5 p-6 rounded-xl border border-white/10">
                    {/* Question Input */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2">Pregunta</label>
                        <input
                            type="text"
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                            placeholder="Escribe la pregunta..."
                        />
                    </div>

                    {/* Time Limit */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Tiempo Límite (segundos)
                        </label>
                        <input
                            type="number"
                            min="5"
                            max="300"
                            value={newQuestion.timeLimit}
                            onChange={(e) => setNewQuestion({ ...newQuestion, timeLimit: parseInt(e.target.value) || 20 })}
                            className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>

                    {/* Options Inputs */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-2">Opciones de Respuesta (Marca la correcta)</label>
                        <div className="space-y-3">
                            {newQuestion.options.map((opt, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <button
                                        onClick={() => setCorrectIndex(idx)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${correctIndex === idx
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-600 text-gray-600 hover:border-gray-400'
                                            }`}
                                    >
                                        {correctIndex === idx && '✓'}
                                    </button>
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...newQuestion.options];
                                            newOpts[idx] = e.target.value;
                                            setNewQuestion({ ...newQuestion, options: newOpts });
                                        }}
                                        className={`flex-1 bg-white/5 border ${correctIndex === idx ? 'border-green-500/30' : 'border-white/10'} rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 outline-none`}
                                        placeholder={`Opción ${idx + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={addQuestion}
                        disabled={!newQuestion.question.trim() || newQuestion.options.some(o => !o.trim())}
                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
                    >
                        Agregar Pregunta
                    </button>
                </div>

                {/* Questions List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {questions.map((q, i) => (
                        <div key={i} className="bg-yellow-900/20 border border-yellow-500/20 p-4 rounded-lg group relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-white font-medium mb-1">{q.question}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" /> {q.timeLimit}s
                                    </div>
                                </div>
                                <button
                                    onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}
                                    className="text-gray-500 hover:text-red-400 p-1"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {q.options.map((opt, optIdx) => (
                                    <div
                                        key={optIdx}
                                        className={`text-xs p-2 rounded border ${opt === q.answer
                                                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                                                : 'bg-black/20 border-white/5 text-gray-400'
                                            }`}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {questions.length === 0 && (
                        <p className="text-gray-500 italic w-full text-center py-4">No hay preguntas agregadas aún</p>
                    )}
                </div>
            </div>
        </div>
    );
}
