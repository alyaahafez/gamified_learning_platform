import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserProfile, LessonProgress, Badge, DailyChallenge, QuestionResult, calculateLevel, calculateQuestionPoints } from '@/types/learning';
import { defaultBadges } from '@/data/badges';
import { lessons } from '@/data/lessons';

interface MockAccount {
  email: string;
  password: string;
  name: string;
}

interface GameState {
  isLoggedIn: boolean;
  hasSelectedSubjects: boolean;
  user: UserProfile;
  newlyEarnedBadge: Badge | null;
  badgeQueue: Badge[];
  levelUpLevel: number | null;
  dismissLevelUp: () => void;
  login: (email: string, password: string) => string | null;
  signup: (name: string, email: string, password: string) => string | null;
  logout: () => void;
  selectSubjects: (subjects: string[]) => void;
  submitAnswer: (lessonId: string, questionId: string, isCorrect: boolean, basePoints: number, questionText: string, questionTopic?: string) => number;
  updateSubjects: (subjects: string[]) => void;
  completeLesson: (lessonId: string) => void;
  completeReview: (lessonId: string) => void;
  getLessonProgress: (lessonId: string) => LessonProgress | undefined;
  getRecommendedLessons: () => string[];
  getReviewLessons: () => string[];
  shouldShowHint: (lessonId: string) => boolean;
  canSkipAhead: (lessonId: string) => boolean;
  getFilteredLessons: () => typeof lessons;
  dismissBadge: () => void;
  getDailyChallenge: () => DailyChallenge | null;
  completeDailyChallenge: () => void;
  getAdaptiveDifficulty: (lessonId: string) => 'easy' | 'medium' | 'hard';
}

const defaultUser: UserProfile = {
  name: '',
  email: '',
  points: 0,
  level: 1,
  streak: 0,
  badges: [...defaultBadges],
  progress: {},
  lessonsCompleted: 0,
  selectedSubjects: [],
  pointsHistory: [],
};

const STORAGE_KEY = 'learningPlatformState';
const ACCOUNTS_KEY = 'learningPlatformAccounts';

const GameContext = createContext<GameState | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

function loadState(): { isLoggedIn: boolean; hasSelectedSubjects: boolean; user: UserProfile } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { isLoggedIn: false, hasSelectedSubjects: false, user: { ...defaultUser } };
}

function loadAccounts(): MockAccount[] {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

function saveAccounts(accounts: MockAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function saveState(isLoggedIn: boolean, hasSelectedSubjects: boolean, user: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ isLoggedIn, hasSelectedSubjects, user }));
}

function generateDailyChallenge(selectedSubjects: string[], progress: Record<string, LessonProgress>): DailyChallenge {
  const today = new Date().toISOString().split('T')[0];
  const filtered = selectedSubjects.length > 0
    ? lessons.filter(l => selectedSubjects.includes(l.subject))
    : lessons;
  // Prefer completed lessons for review-style challenge
  const completedLessons = filtered.filter(l => progress[l.id]?.completed);
  const pool = completedLessons.length > 0 ? completedLessons : filtered;
  const lesson = pool[Math.floor(Math.random() * pool.length)] || lessons[0];
  const indices: number[] = [];
  const available = Array.from({ length: lesson.questions.length }, (_, i) => i);
  for (let i = 0; i < Math.min(5, available.length); i++) {
    const idx = Math.floor(Math.random() * available.length);
    indices.push(available.splice(idx, 1)[0]);
  }
  return { lessonId: lesson.id, questionIndices: indices, date: today, completed: false, bonusPoints: 25 };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(loadState);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<Badge | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);

  const dismissLevelUp = useCallback(() => {
    setLevelUpLevel(null);
  }, []);

  useEffect(() => {
    saveState(state.isLoggedIn, state.hasSelectedSubjects, state.user);
  }, [state]);

  const dismissBadge = useCallback(() => {
    setNewlyEarnedBadge(null);
    setBadgeQueue(prev => {
      const next = prev.slice(1);
      if (next.length > 0) {
        setTimeout(() => setNewlyEarnedBadge(next[0]), 400);
      }
      return next;
    });
  }, []);

  const signup = useCallback((name: string, email: string, password: string): string | null => {
    const accounts = loadAccounts();
    if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase())) {
      return 'An account with this email already exists.';
    }
    accounts.push({ email: email.toLowerCase(), password, name });
    saveAccounts(accounts);
    setState({
      isLoggedIn: true,
      hasSelectedSubjects: false,
      user: { ...defaultUser, badges: [...defaultBadges], name, email: email.toLowerCase(), pointsHistory: [{ date: new Date().toISOString().split('T')[0], points: 0 }] },
    });
    return null;
  }, []);

  const login = useCallback((email: string, password: string): string | null => {
    const accounts = loadAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!account) return 'No account found with this email.';
    if (account.password !== password) return 'Incorrect password.';

    const existing = loadState();
    if (existing.isLoggedIn && existing.user.email === email.toLowerCase()) {
      setState(existing);
    } else {
      setState({
        isLoggedIn: true,
        hasSelectedSubjects: false,
        user: { ...defaultUser, badges: [...defaultBadges], name: account.name, email: email.toLowerCase(), pointsHistory: [{ date: new Date().toISOString().split('T')[0], points: 0 }] },
      });
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ isLoggedIn: false, hasSelectedSubjects: false, user: { ...defaultUser, badges: [...defaultBadges] } });
  }, []);

  const selectSubjects = useCallback((subjects: string[]) => {
    setState(prev => ({
      ...prev,
      hasSelectedSubjects: true,
      user: {
        ...prev.user,
        selectedSubjects: subjects,
        dailyChallenge: generateDailyChallenge(subjects, prev.user.progress),
      },
    }));
  }, []);

  const getFilteredLessons = useCallback(() => {
    if (state.user.selectedSubjects.length === 0) return lessons;
    return lessons.filter(l => state.user.selectedSubjects.includes(l.subject));
  }, [state.user.selectedSubjects]);

  const checkAndAwardBadges = useCallback((user: UserProfile): UserProfile => {
    const updated = { ...user, badges: user.badges.map(b => ({ ...b })) };
    const now = new Date().toISOString();
    const newBadges: Badge[] = [];

    const award = (id: string, reason: string) => {
      const badge = updated.badges.find(b => b.id === id);
      if (badge && !badge.earned) {
        badge.earned = true;
        badge.earnedAt = now;
        badge.earnedReason = reason;
        newBadges.push({ ...badge });
      }
    };

    if (updated.lessonsCompleted >= 1) award('first-lesson', 'You completed your first lesson!');
    if (updated.lessonsCompleted >= 3) award('consistent-learner', 'You completed 3 lessons — great consistency!');
    if (updated.points >= 100) award('point-collector', `You earned ${updated.points} total points!`);
    if (updated.level >= 3) award('half-way', `You reached Level ${updated.level}!`);

    const filteredLessons = updated.selectedSubjects.length > 0
      ? lessons.filter(l => updated.selectedSubjects.includes(l.subject))
      : lessons;
    const allDone = filteredLessons.every(l => updated.progress[l.id]?.completed);
    if (allDone && filteredLessons.length > 0) award('knowledge-master', 'You completed every lesson!');

    Object.entries(updated.progress).forEach(([lessonId, prog]) => {
      if (prog.completed && prog.accuracy === 100) {
        award('perfect-score', `You got 100% on "${lessons.find(l => l.id === lessonId)?.title}"!`);
      }
      if (prog.completed) {
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
          const allFirstAttempt = lesson.questions.every(q => (prog.questionAttempts[q.id] || 0) <= 1);
          if (allFirstAttempt && prog.accuracy >= 80) {
            award('quick-learner', `You aced "${lesson.title}" on the first try!`);
          }
        }
      }
      if (prog.reviewCompleted) award('review-champion', 'You completed a review task!');
    });

    if (updated.dailyChallenge?.completed) {
      award('daily-challenger', 'You completed a daily challenge!');
    }

    if (newBadges.length > 0) {
      setBadgeQueue(prev => [...prev, ...newBadges]);
      setTimeout(() => setNewlyEarnedBadge(newBadges[0]), 300);
    }

    return updated;
  }, []);

  const addPointsHistory = (user: UserProfile): UserProfile => {
    const today = new Date().toISOString().split('T')[0];
    const history = [...(user.pointsHistory || [])];
    const lastEntry = history[history.length - 1];
    if (lastEntry && lastEntry.date === today) {
      lastEntry.points = user.points;
    } else {
      history.push({ date: today, points: user.points });
    }
    return { ...user, pointsHistory: history.slice(-30) };
  };

  const getAdaptiveDifficulty = useCallback((lessonId: string): 'easy' | 'medium' | 'hard' => {
    const progress = state.user.progress[lessonId];
    if (!progress) return 'easy';
    return (progress.currentDifficulty as 'easy' | 'medium' | 'hard') || 'easy';
  }, [state.user.progress]);

  const updateSubjects = useCallback((subjects: string[]) => {
    setState(prev => ({
      ...prev,
      user: {
        ...prev.user,
        selectedSubjects: subjects,
      },
    }));
  }, []);

  const submitAnswer = useCallback((lessonId: string, questionId: string, isCorrect: boolean, basePoints: number, questionText: string, questionTopic?: string): number => {
    let pointsAwarded = 0;
    setState(prev => {
      const progress = prev.user.progress[lessonId] || {
        lessonId, completed: false, score: 0, maxScore: 0, accuracy: 0, attempts: 0,
        questionAttempts: {}, questionResults: [], reviewCompleted: false, currentDifficulty: 'easy', adaptiveMessages: [],
        consecutiveCorrect: 0,
      };
      const attempts = (progress.questionAttempts[questionId] || 0) + 1;
      const newProgress = {
        ...progress,
        questionAttempts: { ...progress.questionAttempts, [questionId]: attempts },
        questionResults: [...(progress.questionResults || [])],
        adaptiveMessages: [...(progress.adaptiveMessages || [])],
        consecutiveCorrect: progress.consecutiveCorrect || 0,
      };

      if (isCorrect) {
        pointsAwarded = calculateQuestionPoints(basePoints, attempts);
        newProgress.score += pointsAwarded;
        const existingIdx = newProgress.questionResults.findIndex(r => r.questionId === questionId);
        const result: QuestionResult = { questionId, questionText, topic: questionTopic || '', correct: true, attempts, pointsEarned: pointsAwarded, maxPoints: basePoints };
        if (existingIdx >= 0) {
          newProgress.questionResults[existingIdx] = result;
        } else {
          newProgress.questionResults.push(result);
        }
      } else {
        const existingIdx = newProgress.questionResults.findIndex(r => r.questionId === questionId);
        if (existingIdx < 0) {
          newProgress.questionResults.push({ questionId, questionText, topic: questionTopic || '', correct: false, attempts, pointsEarned: 0, maxPoints: basePoints });
        } else {
          newProgress.questionResults[existingIdx] = { ...newProgress.questionResults[existingIdx], attempts, correct: false };
        }
      }

      // Simple adaptive difficulty: start Easy, 2 consecutive correct → go up, any wrong → go down
      if (isCorrect && attempts === 1) {
        // First-attempt correct counts toward consecutive streak
        newProgress.consecutiveCorrect = (newProgress.consecutiveCorrect || 0) + 1;
      } else if (!isCorrect) {
        // Wrong answer resets streak and drops difficulty
        newProgress.consecutiveCorrect = 0;
      }

      const streak = newProgress.consecutiveCorrect || 0;
      const currentDiff = newProgress.currentDifficulty || 'easy';

      if (!isCorrect) {
        // Drop down on any wrong answer
        if (currentDiff === 'hard') newProgress.currentDifficulty = 'medium';
        else newProgress.currentDifficulty = 'easy';
        newProgress.consecutiveCorrect = 0;
      } else if (streak >= 2) {
        // 2 consecutive correct → go up
        if (currentDiff === 'easy') newProgress.currentDifficulty = 'medium';
        else if (currentDiff === 'medium') newProgress.currentDifficulty = 'hard';
        // Reset streak counter after leveling up
        if (currentDiff !== 'hard') newProgress.consecutiveCorrect = 0;
      }

      const newLevel = calculateLevel(prev.user.points + pointsAwarded);
      const oldLevel = prev.user.level;
      let newUser = {
        ...prev.user,
        points: prev.user.points + pointsAwarded,
        level: newLevel,
        progress: { ...prev.user.progress, [lessonId]: newProgress },
      };
      newUser = addPointsHistory(newUser);

      if (newLevel > oldLevel) {
        setTimeout(() => setLevelUpLevel(newLevel), 300);
      }

      return { ...prev, user: checkAndAwardBadges(newUser) };
    });
    return pointsAwarded;
  }, [checkAndAwardBadges]);

  const completeLesson = useCallback((lessonId: string) => {
    setState(prev => {
      const progress = prev.user.progress[lessonId];
      if (!progress || progress.completed) return prev;
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return prev;

      const totalQuestions = lesson.questions.length;
      const correctFirstAttempt = lesson.questions.filter(q => (progress.questionAttempts[q.id] || 0) === 1).length;
      const accuracy = totalQuestions > 0 ? Math.round((correctFirstAttempt / totalQuestions) * 100) : 0;

      const newProgress: LessonProgress = {
        ...progress, completed: true, accuracy,
        maxScore: lesson.questions.reduce((sum, q) => sum + q.basePoints, 0),
        completedAt: new Date().toISOString(),
      };

      let bonusPoints = 0;
      let updatedChallenge: DailyChallenge | undefined = prev.user.dailyChallenge;
      // Auto-complete daily challenge if this lesson matches
      if (updatedChallenge && !updatedChallenge.completed && updatedChallenge.lessonId === lessonId) {
        bonusPoints = updatedChallenge.bonusPoints;
        updatedChallenge = { ...updatedChallenge, completed: true };
      }

      let newUser: UserProfile = {
        ...prev.user,
        lessonsCompleted: prev.user.lessonsCompleted + 1,
        streak: prev.user.streak + 1,
        points: prev.user.points + bonusPoints,
        level: calculateLevel(prev.user.points + bonusPoints),
        progress: { ...prev.user.progress, [lessonId]: newProgress },
        dailyChallenge: updatedChallenge,
      };
      newUser = addPointsHistory(newUser);

      return { ...prev, user: checkAndAwardBadges(newUser) };
    });
  }, [checkAndAwardBadges]);

  const completeReview = useCallback((lessonId: string) => {
    setState(prev => {
      const progress = prev.user.progress[lessonId];
      if (!progress) return prev;

      const newProgress = { ...progress, reviewCompleted: true, reviewCompletedAt: new Date().toISOString() };
      let newUser = {
        ...prev.user,
        points: prev.user.points + 5,
        level: calculateLevel(prev.user.points + 5),
        progress: { ...prev.user.progress, [lessonId]: newProgress },
      };
      newUser = addPointsHistory(newUser);
      return { ...prev, user: checkAndAwardBadges(newUser) };
    });
  }, [checkAndAwardBadges]);

  const getDailyChallenge = useCallback((): DailyChallenge | null => {
    const today = new Date().toISOString().split('T')[0];
    const challenge = state.user.dailyChallenge;
    if (!challenge || challenge.date !== today) {
      const newChallenge = generateDailyChallenge(state.user.selectedSubjects, state.user.progress);
      setState(prev => ({ ...prev, user: { ...prev.user, dailyChallenge: newChallenge } }));
      return newChallenge;
    }
    return challenge;
  }, [state.user.dailyChallenge, state.user.selectedSubjects]);

  const completeDailyChallenge = useCallback(() => {
    setState(prev => {
      const challenge = prev.user.dailyChallenge;
      if (!challenge || challenge.completed) return prev;
      let newUser: UserProfile = {
        ...prev.user,
        points: prev.user.points + challenge.bonusPoints,
        level: calculateLevel(prev.user.points + challenge.bonusPoints),
        dailyChallenge: { ...challenge, completed: true },
      };
      newUser = addPointsHistory(newUser);
      return { ...prev, user: checkAndAwardBadges(newUser) };
    });
  }, [checkAndAwardBadges]);

  const getLessonProgress = useCallback((lessonId: string) => state.user.progress[lessonId], [state.user.progress]);

  const getRecommendedLessons = useCallback(() => {
    const filtered = state.user.selectedSubjects.length > 0
      ? lessons.filter(l => state.user.selectedSubjects.includes(l.subject))
      : lessons;
    const completed = new Set(Object.keys(state.user.progress).filter(id => state.user.progress[id].completed));
    return filtered
      .filter(l => !completed.has(l.id))
      .sort((a, b) => a.order - b.order)
      .slice(0, 3)
      .map(l => l.id);
  }, [state.user.progress, state.user.selectedSubjects]);

  const getReviewLessons = useCallback(() => {
    return Object.keys(state.user.progress)
      .filter(id => state.user.progress[id].completed && !state.user.progress[id].reviewCompleted);
  }, [state.user.progress]);

  const shouldShowHint = useCallback((lessonId: string) => {
    const progress = state.user.progress[lessonId];
    if (!progress) return false;
    return Object.values(progress.questionAttempts).filter(a => a >= 2).length >= 2;
  }, [state.user.progress]);

  const canSkipAhead = useCallback((lessonId: string) => {
    const progress = state.user.progress[lessonId];
    if (!progress) return false;
    return progress.accuracy === 100 && progress.completed;
  }, [state.user.progress]);

  return (
    <GameContext.Provider value={{
      isLoggedIn: state.isLoggedIn, hasSelectedSubjects: state.hasSelectedSubjects,
      user: state.user, newlyEarnedBadge, badgeQueue, levelUpLevel, dismissLevelUp, login, signup, logout, selectSubjects, updateSubjects,
      submitAnswer, completeLesson, completeReview, getLessonProgress,
      getRecommendedLessons, getReviewLessons, shouldShowHint, canSkipAhead, getFilteredLessons,
      dismissBadge, getDailyChallenge, completeDailyChallenge, getAdaptiveDifficulty,
    }}>
      {children}
    </GameContext.Provider>
  );
}
