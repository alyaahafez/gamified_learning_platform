export interface Question {
  id: string;
  text: string;
  topic: string;
  type: 'multiple-choice' | 'short-answer';
  options?: string[];
  correctAnswer: string;
  hint: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
  basePoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  questions: Question[];
  order: number;
  category: string;
  subject: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
  earned: boolean;
  earnedAt?: string;
  earnedReason?: string;
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  topic: string;
  correct: boolean;
  attempts: number;
  pointsEarned: number;
  maxPoints: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score: number;
  maxScore: number;
  accuracy: number;
  attempts: number;
  completedAt?: string;
  questionAttempts: Record<string, number>;
  questionResults?: QuestionResult[];
  reviewCompleted: boolean;
  reviewCompletedAt?: string;
  currentDifficulty?: 'easy' | 'medium' | 'hard';
  consecutiveCorrect?: number;
  adaptiveMessages?: string[];
}

export interface DailyChallenge {
  lessonId: string;
  questionIndices: number[];
  date: string;
  completed: boolean;
  bonusPoints: number;
}

export interface UserProfile {
  name: string;
  email: string;
  points: number;
  level: number;
  streak: number;
  badges: Badge[];
  progress: Record<string, LessonProgress>;
  lessonsCompleted: number;
  selectedSubjects: string[];
  pointsHistory: { date: string; points: number }[];
  dailyChallenge?: DailyChallenge;
}

export const SUBJECTS = [
  { id: 'cs', name: 'Computer Science', icon: 'Monitor' },
  { id: 'accounting', name: 'Accounting', icon: 'Calculator' },
  { id: 'economics', name: 'Economics', icon: 'TrendingUp' },
  { id: 'digital-marketing', name: 'Digital Marketing', icon: 'Megaphone' },
  { id: 'business', name: 'Business Management', icon: 'Briefcase' },
  { id: 'data-science', name: 'Data Science', icon: 'BarChart3' },
] as const;

export function calculateLevel(points: number): number {
  if (points < 50) return 1;
  if (points < 150) return 2;
  if (points < 300) return 3;
  if (points < 500) return 4;
  if (points < 800) return 5;
  if (points < 1200) return 6;
  if (points < 1700) return 7;
  if (points < 2300) return 8;
  if (points < 3000) return 9;
  return 10;
}

export function pointsForNextLevel(level: number): number {
  const thresholds = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 999999];
  return thresholds[level] ?? 999999;
}

export function calculateQuestionPoints(basePoints: number, attempts: number): number {
  if (attempts === 1) return basePoints;
  if (attempts === 2) return Math.floor(basePoints * 0.5);
  if (attempts === 3) return Math.floor(basePoints * 0.25);
  return 0;
}
