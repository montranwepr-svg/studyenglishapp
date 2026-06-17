export type LearnerLevel = "beginner" | "intermediate" | "advanced";

export interface VocabularyItem {
  id: string;
  word: string;
  pronunciation: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  level: LearnerLevel;
  imageUrl?: string;
  category?: string;
  isCustom?: boolean; // Word imported or added by user
  progressStatus?: "new" | "review" | "learned";
}

export interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "spelling" | "translation";
  question: string;
  options?: string[];
  correctAnswer: string;
  hint?: string;
}

export interface LessonNode {
  id: string;
  title: string;
  description: string;
  level: LearnerLevel;
  vocabularyIds: string[];
  quizzes: QuizQuestion[];
  isCompleted?: boolean;
}

export interface LearningProgress {
  currentLevel: LearnerLevel;
  completedLessons: string[]; // lesson ids
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  points: number;
  customVocabulary: VocabularyItem[]; // user added vocabulary
  learnedWordsCount: number;
  dailyGoal: number; // minutes or words to learn
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  translation?: string;
  suggestion?: string; // Grammar correction suggestions
  timestamp: string;
}

export interface AICharacter {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string; // Tailwind bg color or class
  accent: "us" | "uk";
  greeting: string;
}
