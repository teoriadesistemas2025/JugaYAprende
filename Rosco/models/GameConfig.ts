import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
    letter: string;
    question: string;
    answer: string;
    startsWith: boolean; // true = "Empieza con", false = "Contiene"
    justification?: string;
}

export interface ITriviaQuestion {
    question: string;
    options: string[];
    answer: string; // The correct answer string
    timeLimit?: number; // Seconds
}

export interface IGameConfig extends Document {
    creatorId: mongoose.Types.ObjectId;
    title: string;
    type: 'ROSCO' | 'HANGMAN' | 'TRIVIA' | 'WORD_SEARCH' | 'MEMORY' | 'BATTLESHIP' | 'KAHOOT';
    questions: any; // ITriviaQuestion[] for TRIVIA/KAHOOT
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSchema = new Schema({
    letter: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    startsWith: { type: Boolean, default: true },
    justification: { type: String, required: false },
});

const GameConfigSchema = new Schema({
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ['ROSCO', 'HANGMAN', 'TRIVIA', 'WORD_SEARCH', 'MEMORY', 'BATTLESHIP', 'KAHOOT'],
        default: 'ROSCO',
        required: true
    },
    questions: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Force model recompilation in dev to apply schema changes
if (process.env.NODE_ENV === 'development' && mongoose.models.GameConfig) {
    delete mongoose.models.GameConfig;
}

export default mongoose.models.GameConfig || mongoose.model<IGameConfig>('GameConfig', GameConfigSchema);
