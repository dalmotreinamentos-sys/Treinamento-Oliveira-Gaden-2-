export enum LightRequirement {
  FULL_SUN = "Sol pleno",
  PARTIAL_SHADE = "Meia-sombra",
  SHADE = "Sombra"
}

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  light: LightRequirement;
  category: string;
  trivia: string;
  imageUrl: string;
}

export interface UserProgress {
  plantsStudiedCount: number;
  lastStudyDate: string | null;
  streakDays: number;
  quizTotalQuestions: number;
  quizCorrectAnswers: number;
  history: StudySession[];
}

export interface StudySession {
  date: string;
  type: 'CYCLE' | 'QUIZ';
  score?: number;
}

export interface QuizQuestion {
  id: number;
  type: 'SCIENTIFIC_TO_COMMON' | 'COMMON_TO_LIGHT' | 'PHOTO_TO_COMMON';
  questionText: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: string;
}