import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { pointsForNextLevel, SUBJECTS } from '@/types/learning';
import { SubjectIcon } from '@/components/SubjectIcon';
import { BadgeIcon } from '@/components/BadgeIcon';
import { SurveyPopup } from '@/components/SurveyPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Trophy, Flame, Star, BookOpen, Target, ArrowRight, RefreshCw, Award, Zap, Info, MessageSquareHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { lessons } from '@/data/lessons';

export default function Dashboard() {
  const { user, getRecommendedLessons, getReviewLessons, getFilteredLessons, getDailyChallenge } = useGame();
  const navigate = useNavigate();
  const recommended = getRecommendedLessons();
  const reviews = getReviewLessons();
  const filtered = getFilteredLessons();
  const allLessons = filtered;
  const dailyChallenge = getDailyChallenge();

  const [selectedBadge, setSelectedBadge] = useState<typeof user.badges[0] | null>(null);

  const firstName = user.name.split(' ')[0];
  const nextLevelPoints = pointsForNextLevel(user.level);
  const prevLevelPoints = pointsForNextLevel(user.level - 1);
  const levelProgress = ((user.points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100;

  const completedCount = Object.values(user.progress).filter(p => p.completed).length;
  const totalLessons = allLessons.length;
  const overallProgress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const earnedBadges = user.badges.filter(b => b.earned);

  const completedLessons = Object.entries(user.progress).filter(([, p]) => p.completed);
  const avgFirstAttempt = completedLessons.length > 0
    ? Math.round(completedLessons.reduce((sum, [, p]) => sum + p.accuracy, 0) / completedLessons.length)
    : 0;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  const stats = [
    { icon: Star, label: 'Total Points', value: user.points, color: 'primary', tooltip: 'Points earned from completing quizzes. More correct answers on the first try = more points.' },
    { icon: Trophy, label: `${nextLevelPoints - user.points} pts to next`, value: `Level ${user.level}`, color: 'xp', tooltip: `You are Level ${user.level}. Earn ${nextLevelPoints - user.points} more points to level up.` },
    { icon: Flame, label: 'Lesson Streak', value: user.streak, color: 'streak', tooltip: 'The number of lessons you have completed consecutively. Keep it going!' },
    { icon: BookOpen, label: 'Lessons Completed', value: `${completedCount}/${totalLessons}`, color: 'info', tooltip: `You have completed ${completedCount} out of ${totalLessons} available lessons.` },
  ];

  // Find a completed lesson for daily challenge review
  const dailyChallengeLesson = dailyChallenge ? (allLessons.find(l => l.id === dailyChallenge.lessonId) || lessons.find(l => l.id === dailyChallenge.lessonId)) : null;

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey</p>
        </div>

        {/* Stats row */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={i} variants={item}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-default">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${stat.color}/10`}>
                          <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold font-display">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-center">
                  <p className="text-xs">{stat.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </motion.div>

        {/* Level + Course progress */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Level {user.level} Progress</span>
                <span className="text-sm text-muted-foreground">{user.points} / {nextLevelPoints} XP</span>
              </div>
              <Progress value={Math.min(levelProgress, 100)} className="h-3" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">{completedCount}/{totalLessons} lessons ({Math.round(overallProgress)}%)</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </CardContent>
          </Card>
        </div>

        {/* Daily Challenge */}
        {dailyChallenge && !dailyChallenge.completed && dailyChallengeLesson && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-accent/20 via-primary/10 to-accent/5 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center backdrop-blur-sm border border-accent/20">
                      <Zap className="h-7 w-7 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-display font-bold text-lg">Daily Challenge</p>
                        <Badge className="bg-accent/10 text-accent border-accent/20 text-xs">+{dailyChallenge.bonusPoints} XP</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Review <span className="font-medium text-foreground">"{dailyChallengeLesson.title}"</span></p>
                      <p className="text-xs text-muted-foreground mt-1">Complete for bonus points and the Daily Challenger badge!</p>
                    </div>
                  </div>
                  <Button size="lg" onClick={() => navigate(`/lessons/${dailyChallenge.lessonId}`)} className="gap-2 shadow-md">
                    <Zap className="h-4 w-4" /> Accept
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        {dailyChallenge?.completed && (
          <Card className="border-0 shadow-md border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">Daily Challenge Completed! 🎉</p>
                  <p className="text-xs text-muted-foreground">+{dailyChallenge.bonusPoints} bonus points earned today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Survey Banner */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquareHeart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">Take the Survey!</p>
                  <p className="text-xs text-muted-foreground">Your feedback is essential for evaluating this platform</p>
                </div>
              </div>
              <Button size="sm" onClick={() => window.open('https://forms.gle/75kEyaNSmNWqvmEy8', '_blank')} className="gap-2 w-full sm:w-auto">
                <MessageSquareHeart className="h-4 w-4" /> Take Survey
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recommended */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Target className="h-5 w-5 text-primary" />
                Recommended Next
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Recommended based on your performance
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommended.length === 0 ? (
                <p className="text-muted-foreground text-sm">All lessons completed! Great work!</p>
              ) : (
                recommended.map(id => {
                  const lesson = allLessons.find(l => l.id === id);
                  if (!lesson) return null;
                  const subject = SUBJECTS.find(s => s.id === lesson.subject);
                  return (
                    <button
                      key={id}
                      onClick={() => navigate(`/lessons/${id}`)}
                      className="flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all hover:bg-secondary/50 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {subject && <SubjectIcon icon={subject.icon} className="h-5 w-5 text-muted-foreground" />}
                        <div>
                          <p className="font-medium text-sm">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">{lesson.questions.length} questions</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <RefreshCw className="h-5 w-5 text-primary" />
                Review Tasks
              </CardTitle>
              <p className="text-xs text-muted-foreground">These tasks help you remember previously learned content</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews available yet. Complete a lesson first!</p>
              ) : (
                reviews.map(id => {
                  const lesson = allLessons.find(l => l.id === id) || lessons.find(l => l.id === id);
                  if (!lesson) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => navigate(`/review/${id}`)}
                      className="flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all hover:bg-secondary/50 hover:shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">Review to strengthen retention</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Review</Badge>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Award className="h-5 w-5 text-accent" />
              Badges Earned ({earnedBadges.length}/{user.badges.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">Click a badge to see details</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {user.badges.map(badge => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`flex flex-col items-center text-center rounded-xl p-4 transition-all cursor-pointer hover:shadow-md ${
                    badge.earned ? 'bg-primary/5 border border-primary/10 hover:bg-primary/10' : 'bg-muted/30 opacity-40 hover:opacity-60'
                  }`}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-2 ${
                    badge.earned ? 'bg-accent/10' : 'bg-muted'
                  }`}>
                    <BadgeIcon badgeId={badge.id} className={`h-6 w-6 ${badge.earned ? 'text-accent' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-sm font-medium">{badge.name}</p>
                  {badge.earned && (
                    <Badge className="mt-2 bg-badge-earned text-accent-foreground text-xs">Earned!</Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Badge Detail Dialog */}
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display text-lg flex items-center gap-2">
                {selectedBadge && <BadgeIcon badgeId={selectedBadge.id} className="h-5 w-5 text-accent" />}
                {selectedBadge?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedBadge && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className={`h-20 w-20 rounded-2xl flex items-center justify-center ${selectedBadge.earned ? 'bg-accent/10' : 'bg-muted'}`}>
                    <BadgeIcon badgeId={selectedBadge.id} className={`h-10 w-10 ${selectedBadge.earned ? 'text-accent' : 'text-muted-foreground'}`} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">{selectedBadge.description}</p>
                  <div className="rounded-lg bg-secondary p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">How to earn</p>
                    <p className="text-sm">{selectedBadge.condition}</p>
                  </div>
                  {selectedBadge.earned ? (
                    <Badge className="bg-badge-earned text-accent-foreground text-sm py-1 px-3">Earned!</Badge>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Not yet earned — keep going!</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <SurveyPopup />
      </div>
    </TooltipProvider>
  );
}
