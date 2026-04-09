import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessons } from '@/data/lessons';
import { useGame } from '@/context/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function ReviewPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { completeReview, getLessonProgress } = useGame();

  const lesson = lessons.find(l => l.id === lessonId);
  const progress = getLessonProgress(lessonId || '');

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (!lesson || !progress?.completed) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Lesson not found or not completed yet</p>
      </div>
    );
  }

  if (progress.reviewCompleted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <CardContent className="pt-8 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold">Review Already Completed</h2>
            <p className="text-muted-foreground text-sm">You've already reviewed this lesson.</p>
            <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pick 3 random questions for review
  const reviewQuestions = lesson.questions.slice(0, 3);
  const question = reviewQuestions[currentQ];

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    if (answer === question.correctAnswer) setCorrectCount(c => c + 1);
    setShowResult(true);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    if (currentQ < reviewQuestions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      completeReview(lesson.id);
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center">
            <CardContent className="pt-8 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <RefreshCw className="h-7 w-7 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold">Review Complete!</h2>
              <p className="text-muted-foreground text-sm">
                You got {correctCount}/{reviewQuestions.length} correct. +5 bonus XP!
              </p>
              <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="text-center space-y-1">
        <Badge variant="outline">Review Mode</Badge>
        <h2 className="font-display text-xl font-bold">{lesson.title}</h2>
        <p className="text-sm text-muted-foreground">Question {currentQ + 1} of {reviewQuestions.length}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">{question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options?.map(option => {
            let extraClass = 'hover:bg-secondary';
            if (showResult) {
              if (option === question.correctAnswer) extraClass = 'border-primary bg-primary/10';
              else if (option === selectedAnswer) extraClass = 'border-destructive bg-destructive/10';
              else extraClass = 'opacity-50';
            }
            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className={`w-full text-left rounded-lg border p-4 transition-all ${extraClass}`}
              >
                {option}
              </button>
            );
          })}

          {showResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2 text-sm">
                {selectedAnswer === question.correctAnswer ? (
                  <><CheckCircle2 className="h-4 w-4 text-primary" /> Correct!</>
                ) : (
                  <><XCircle className="h-4 w-4 text-destructive" /> Answer: {question.correctAnswer}</>
                )}
              </div>
              <Button onClick={handleNext} size="sm">
                {currentQ < reviewQuestions.length - 1 ? 'Next' : 'Finish Review'}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
