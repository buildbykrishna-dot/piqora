export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  text: string;
  options: [string, string, string, string]; // [Option A, Option B, Option C, Option D]
  correctAnswer: OptionLetter;
  explanation?: string;
  timeLimit: number; // in seconds, default 20
  points: number; // default 1000
  order: number;
}

export interface Quiz {
  id: string;
  teacherId: string;
  ownerId?: string;
  title: string;
  description: string;
  subject: string;
  courseLabel?: string;
  coverColor?: string;
  tags?: string[];
  isPublished: boolean;
  isPublic?: boolean;
  questionsCount: number;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionSet {
  id: string;
  teacherId: string;
  ownerId?: string;
  title: string;
  description: string;
  subject: string;
  questionCount: number;
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonExternalLink {
  title: string;
  url: string;
}

export interface Lesson {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  subject: string;
  content: string;
  externalLinks?: LessonExternalLink[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type QuizSessionStatus = 'waiting' | 'question' | 'reveal' | 'leaderboard' | 'finished';

export interface QuizSession {
  id: string;
  pin: string;
  quizId: string;
  quizTitle: string;
  teacherId: string;
  status: QuizSessionStatus;
  currentQuestionIndex: number;
  questionStartedAt: number;
  totalQuestions: number;
  participantCount: number;
  questionsSnapshot: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  displayName: string;
  score: number;
  streak: number;
  correctCount: number;
  answeredCount: number;
  lastAnswer?: OptionLetter;
  joinedAt: string;
}

export interface AnswerSubmission {
  id: string;
  sessionId: string;
  participantId: string;
  questionIndex: number;
  selectedOption: OptionLetter;
  isCorrect: boolean;
  pointsAwarded: number;
  responseTimeMs: number;
  submittedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  college?: string;
  department?: string;
  role: 'teacher' | 'admin';
  createdAt: string;
}

export interface ImportedQuestionRow {
  rowNumber: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: OptionLetter | null;
  timeLimit?: number;
  points?: number;
  explanation?: string;
  isValid: boolean;
  errors: string[];
}
