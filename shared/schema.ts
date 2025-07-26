import { z } from "zod";

// Patient information schema
export const patientInfoSchema = z.object({
  patientInfo: z.string().min(10, "Patient information must be at least 10 characters"),
  difficultyLevel: z.enum(["auto", "beginner", "intermediate", "advanced"]).default("auto"),
  experienceLevel: z.enum(["new", "some", "experienced"]).optional(),
  timeAvailable: z.enum(["limited", "moderate", "extended"]).optional(),
});

export type PatientInfo = z.infer<typeof patientInfoSchema>;

// DailyMed API response types
export interface DailyMedResult {
  setId: string;
  title: string;
  genericName?: string;
  brandName?: string;
  labeler?: string;
  activeIngredients?: string[];
  indications?: string;
  dosageAndAdministration?: string;
  contraindications?: string;
  warningsAndPrecautions?: string;
  adverseReactions?: string;
}

export interface DailyMedDetails {
  setId: string;
  title: string;
  genericName?: string;
  brandName?: string;
  labeler?: string;
  activeIngredients?: string[];
  indications?: string;
  dosageAndAdministration?: string;
  contraindications?: string;
  warningsAndPrecautions?: string;
  adverseReactions?: string;
}

// Game types and difficulty levels
export type GameType = 'crossword' | 'wordsearch' | 'fillblank' | 'multiplechoice' | 'matching' | 'truefalse';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface GameModule {
  level: DifficultyLevel;
  title: string;
  description: string;
  estimatedTime: string;
  games: Game[];
}

export interface LearningAssessment {
  patientConditions: string[];
  medicationFamiliarity: 'new' | 'some' | 'experienced';
  timeConstraints: 'limited' | 'moderate' | 'extended';
  preferredLearningStyle: 'visual' | 'text' | 'interactive';
  suggestedStartingLevel: DifficultyLevel;
}

export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
}

export interface CrosswordGame {
  type: 'crossword';
  title: string;
  difficulty: DifficultyLevel;
  grid: string[][];
  clues: CrosswordClue[];
}

export interface WordSearchGame {
  type: 'wordsearch';
  title: string;
  difficulty: DifficultyLevel;
  grid: string[][];
  words: string[];
}

export interface FillBlankGame {
  type: 'fillblank';
  title: string;
  difficulty: DifficultyLevel;
  text: string;
  blanks: { position: number; answer: string }[];
  wordBank: string[];
}

export interface MultipleChoiceGame {
  type: 'multiplechoice';
  title: string;
  difficulty: DifficultyLevel;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export interface MatchingGame {
  type: 'matching';
  title: string;
  difficulty: DifficultyLevel;
  pairs: { left: string; right: string }[];
}

export interface TrueFalseGame {
  type: 'truefalse';
  title: string;
  difficulty: DifficultyLevel;
  questions: {
    statement: string;
    isTrue: boolean;
  }[];
}

export type Game = CrosswordGame | WordSearchGame | FillBlankGame | MultipleChoiceGame | MatchingGame | TrueFalseGame;

// API response schemas
export const generateGamesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  games: z.array(z.any()).optional(),
  modules: z.array(z.any()).optional(),
  assessment: z.any().optional(),
  dailyMedResults: z.array(z.any()).optional(),
  processingSteps: z.array(z.object({
    step: z.string(),
    status: z.enum(['pending', 'processing', 'complete', 'error']),
    message: z.string().optional(),
  })).optional(),
});

export type GenerateGamesResponse = z.infer<typeof generateGamesResponseSchema>;

// Processing pipeline step
export interface ProcessingStep {
  step: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message?: string;
}

// User types for storage
export interface User {
  id: number;
  username: string;
}

export interface InsertUser {
  username: string;
}
