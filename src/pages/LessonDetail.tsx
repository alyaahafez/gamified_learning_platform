import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessons } from '@/data/lessons';
import { useGame } from '@/context/GameContext';
import { QuestionResult } from '@/types/learning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, BookOpen, AlertTriangle, Trophy, Target, Brain, XCircle, Minus } from 'lucide-react';

export default function LessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { submitAnswer, completeLesson, getLessonProgress, getAdaptiveDifficulty } = useGame();

  const lesson = useMemo(() => lessons.find(l => l.id === lessonId), [lessonId]);

  const [phase, setPhase] = useState<'reading' | 'quiz' | 'results'>('reading');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string; points: number } | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<Set<string>>(new Set());
  const [totalEarned, setTotalEarned] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [reviewingQuestion, setReviewingQuestion] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0);

  const totalQuestions = lesson ? lesson.questions.length : 0;
  const adaptiveDifficulty = lessonId ? getAdaptiveDifficulty(lessonId) : 'easy';

  // Pick next question matching adaptive difficulty
  const pickNextQuestion = () => {
    if (!lesson) return null;
    const unanswered = lesson.questions.filter(q => !answeredQuestionIds.has(q.id));
    if (unanswered.length === 0) return null;

    // Priority: exact difficulty match
    const exact = unanswered.filter(q => q.difficulty === adaptiveDifficulty);
    if (exact.length > 0) return exact[Math.floor(Math.random() * exact.length)];

    // Adjacent difficulty
    const adjacentMap: Record<string, string[]> = {
      easy: ['medium'],
      medium: ['easy', 'hard'],
      hard: ['medium'],
    };
    const adjacent = unanswered.filter(q => adjacentMap[adaptiveDifficulty]?.includes(q.difficulty));
    if (adjacent.length > 0) return adjacent[Math.floor(Math.random() * adjacent.length)];

    // Fallback
    return unanswered[Math.floor(Math.random() * unanswered.length)];
  };

  // Auto-select first question when entering quiz phase
  useEffect(() => {
    if (phase === 'quiz' && !currentQuestionId && !reviewingQuestion) {
      const next = pickNextQuestion();
      if (next) setCurrentQuestionId(next.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const question = useMemo(() => {
    if (!lesson || !currentQuestionId) return null;
    return lesson.questions.find(q => q.id === currentQuestionId) || null;
  }, [currentQuestionId, lesson]);

  const quizProgress = totalQuestions > 0 ? (questionsAnsweredCount / totalQuestions) * 100 : 0;

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    );
  }

  const difficultyColors: Record<string, string> = {
    easy: 'bg-primary/10 text-primary border-primary/20',
    medium: 'bg-accent/10 text-accent border-accent/20',
    hard: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const handleAnswer = (answer: string) => {
    if (feedback || !question) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === question.correctAnswer;
    const points = submitAnswer(lesson.id, question.id, isCorrect, question.basePoints, question.text, question.topic);
    const newAttempt = attemptCount + 1;
    setAttemptCount(newAttempt);

    if (isCorrect) {
      setAnsweredCorrectly(prev => new Set(prev).add(question.id));
      setTotalEarned(prev => prev + points);
      setQuestionResults(prev => {
        const existing = prev.findIndex(r => r.questionId === question.id);
        const result: QuestionResult = { questionId: question.id, questionText: question.text, topic: question.topic, correct: true, attempts: newAttempt, pointsEarned: points, maxPoints: question.basePoints };
        if (existing >= 0) { const copy = [...prev]; copy[existing] = result; return copy; }
        return [...prev, result];
      });
      setFeedback({ correct: true, message: question.feedback.correct, points });
    } else {
      setQuestionResults(prev => {
        const existing = prev.findIndex(r => r.questionId === question.id);
        const result: QuestionResult = { questionId: question.id, questionText: question.text, topic: question.topic, correct: false, attempts: newAttempt, pointsEarned: 0, maxPoints: question.basePoints };
        if (existing >= 0) { const copy = [...prev]; copy[existing] = result; return copy; }
        return [...prev, result];
      });
      setFeedback({ correct: false, message: question.hint, points: 0 });
    }
  };

  const handleNext = () => {
    if (!question) return;
    // Mark current question as answered
    setAnsweredQuestionIds(prev => new Set(prev).add(question.id));
    const newCount = questionsAnsweredCount + 1;
    setQuestionsAnsweredCount(newCount);

    setSelectedAnswer(null);
    setFeedback(null);
    setAttemptCount(0);

    // Check if there are more unanswered questions
    const remaining = lesson.questions.filter(q => !answeredQuestionIds.has(q.id) && q.id !== question.id);
    if (remaining.length === 0 || newCount >= totalQuestions) {
      completeLesson(lesson.id);
      setPhase('results');
    } else {
      // Pick next question based on updated adaptive difficulty (will re-read from context)
      // We need to use a timeout so the adaptive difficulty updates from submitAnswer first
      setTimeout(() => {
        const unanswered = lesson.questions.filter(q => !answeredQuestionIds.has(q.id) && q.id !== question.id);
        const diff = getAdaptiveDifficulty(lesson.id);
        
        const exact = unanswered.filter(q => q.difficulty === diff);
        if (exact.length > 0) { setCurrentQuestionId(exact[Math.floor(Math.random() * exact.length)].id); return; }
        
        const adjacentMap: Record<string, string[]> = { easy: ['medium'], medium: ['easy', 'hard'], hard: ['medium'] };
        const adjacent = unanswered.filter(q => adjacentMap[diff]?.includes(q.difficulty));
        if (adjacent.length > 0) { setCurrentQuestionId(adjacent[Math.floor(Math.random() * adjacent.length)].id); return; }
        
        setCurrentQuestionId(unanswered[Math.floor(Math.random() * unanswered.length)].id);
      }, 0);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setSelectedAnswer(null);
  };

  if (phase === 'reading') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/lessons')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Lessons
        </Button>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <Badge variant="secondary" className="w-fit mb-2">{lesson.category}</Badge>
            <CardTitle className="font-display text-2xl">{lesson.title}</CardTitle>
            <p className="text-muted-foreground">{lesson.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              {lesson.content.split('\n').map((para, i) => (
                <p key={i} className="text-foreground/90 leading-relaxed whitespace-pre-wrap"
                   dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              ))}
            </div>
            <div className="pt-6 border-t">
              <Button onClick={() => setPhase('quiz')} className="gap-2" size="lg">
                <BookOpen className="h-4 w-4" /> Start Quiz ({lesson.questions.length} questions)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'results') {
    const maxScore = questionResults.reduce((s, r) => s + r.maxPoints, 0);
    const correctCount = answeredCorrectly.size;
    const firstAttemptRate = questionsAnsweredCount > 0 ? Math.round((correctCount / questionsAnsweredCount) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-8 space-y-6">
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="h-20 w-20 rounded-2xl mx-auto flex items-center justify-center bg-primary/10"
                >
                  {firstAttemptRate === 100 ? (
                    <Trophy className="h-10 w-10 text-primary" />
                  ) : firstAttemptRate >= 70 ? (
                    <Target className="h-10 w-10 text-accent" />
                  ) : (
                    <BookOpen className="h-10 w-10 text-info" />
                  )}
                </motion.div>
                <h2 className="font-display text-2xl font-bold">Lesson Complete!</h2>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-primary/5 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{totalEarned}/{maxScore}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="rounded-xl bg-accent/5 p-3 text-center">
                  <p className="text-2xl font-bold text-accent">{firstAttemptRate}%</p>
                  <p className="text-xs text-muted-foreground">First Attempt</p>
                </div>
                <div className="rounded-xl bg-info/5 p-3 text-center">
                  <p className="text-2xl font-bold text-info">{correctCount}/{questionsAnsweredCount}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
              </div>

              {/* Detailed Points Breakdown */}
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Points Breakdown
                </h3>
                <div className="space-y-2">
                  {questionResults.map((r, i) => {
                    const topic = r.topic || 'General';
                    const q = lesson.questions.find(q => q.id === r.questionId);
                    return (
                      <button
                        key={r.questionId}
                        onClick={() => {
                          if (q) {
                            setCurrentQuestionId(q.id);
                            setSelectedAnswer(null);
                            setFeedback(null);
                            setAttemptCount(0);
                            setReviewingQuestion(true);
                            setPhase('quiz');
                          }
                        }}
                        className="w-full rounded-lg bg-secondary/50 px-4 py-3 space-y-1 text-left hover:bg-secondary/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {r.correct ? (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            <span className="text-sm font-medium">Q{i + 1}: {topic}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 border ${difficultyColors[q?.difficulty || 'easy']}`}>
                              {q?.difficulty || 'easy'}
                            </Badge>
                          </div>
                          <span className={`text-sm font-bold ${r.pointsEarned < r.maxPoints ? 'text-destructive' : 'text-primary'}`}>
                            {r.pointsEarned}/{r.maxPoints} pts
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pl-6">
                          <span>{r.attempts} attempt{r.attempts !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{r.maxPoints > 0 ? Math.round((r.pointsEarned / r.maxPoints) * 100) : 0}% earned</span>
                        </div>
                      </button>
                    );
                  })}
                  {totalEarned < maxScore && (
                    <div className="flex items-center justify-between rounded-lg bg-destructive/5 px-4 py-3 border border-destructive/10">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-destructive shrink-0" />
                        <span className="text-sm font-medium text-destructive">Points Lost</span>
                      </div>
                      <span className="text-sm font-bold text-destructive">-{maxScore - totalEarned} pts</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={() => navigate('/lessons')}>All Lessons</Button>
                <Button onClick={() => navigate('/')}>Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Quiz phase
  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading question...</p>
      </div>
    );
  }

  const progress = getLessonProgress(lesson.id);
  const currentAttempts = progress?.questionAttempts[question.id] || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => {
          if (reviewingQuestion) {
            setReviewingQuestion(false);
            setPhase('results');
          } else {
            setPhase('reading');
          }
        }} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {reviewingQuestion ? 'Back to Results' : 'Back to Reading'}
        </Button>
        <span className="text-sm text-muted-foreground font-medium">
          {reviewingQuestion ? 'Reviewing' : `Question ${questionsAnsweredCount + 1} of ${totalQuestions}`}
        </span>
      </div>

      <Progress value={quizProgress} className="h-2" />

      {/* Difficulty + points */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`text-xs border ${difficultyColors[adaptiveDifficulty]}`}>
            {adaptiveDifficulty.charAt(0).toUpperCase() + adaptiveDifficulty.slice(1)}
          </Badge>
          <Badge variant="outline" className="text-xs">{question.basePoints} pts</Badge>
        </div>
        {currentAttempts > 0 && !feedback?.correct && (
          <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
            {currentAttempts} attempt{currentAttempts !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id + '-' + attemptCount}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-display text-lg">{question.text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Points reduction warning */}
              {currentAttempts > 0 && !feedback && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span className="text-muted-foreground">
                    Points reduced to {currentAttempts === 1 ? '50%' : currentAttempts === 2 ? '25%' : '0'} for this question.
                  </span>
                </div>
              )}

              {question.options?.map(option => {
                let extraClass = 'hover:bg-secondary hover:border-primary/30';
                if (feedback) {
                  if (feedback.correct && option === question.correctAnswer) {
                    extraClass = 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20';
                  } else if (!feedback.correct && option === selectedAnswer) {
                    extraClass = 'border-destructive bg-destructive/10 text-destructive';
                  } else if (feedback.correct) {
                    extraClass = 'opacity-40';
                  } else {
                    extraClass = 'opacity-60';
                  }
                }
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={!!feedback}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${extraClass} ${
                      !feedback ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}

              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-4 ${
                    feedback.correct
                      ? 'bg-primary/10 border-2 border-primary/20'
                      : 'bg-warning/10 border-2 border-warning/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {feedback.correct ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Lightbulb className="h-5 w-5 text-warning" />
                    )}
                    <span className="font-medium text-sm">
                      {feedback.correct ? `Correct! +${feedback.points} points` : 'Not quite — here\'s a hint:'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{feedback.message}</p>
                </motion.div>
              )}

              {feedback && (
                <div className="flex justify-end gap-2 pt-2">
                  {reviewingQuestion ? (
                    <Button onClick={() => { setReviewingQuestion(false); setPhase('results'); }} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Back to Results
                    </Button>
                  ) : !feedback.correct ? (
                    <>
                      <Button variant="outline" onClick={handleRetry}>
                        Try Again {currentAttempts >= 3 ? '(0 pts)' : `(${currentAttempts === 1 ? '50%' : '25%'} pts)`}
                      </Button>
                      <Button variant="ghost" onClick={handleNext} className="gap-2">
                        Skip <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleNext} className="gap-2">
                      {questionsAnsweredCount + 1 < totalQuestions && lesson.questions.some(q => !answeredQuestionIds.has(q.id) && q.id !== question.id) ? (
                        <>Next <ArrowRight className="h-4 w-4" /></>
                      ) : (
                        'Finish Lesson'
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
