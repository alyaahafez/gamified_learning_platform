import { useGame } from '@/context/GameContext';
import { lessons } from '@/data/lessons';
import { SUBJECTS } from '@/types/learning';
import { SubjectIcon } from '@/components/SubjectIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';

export default function ProgressPage() {
  const { user, getFilteredLessons } = useGame();
  const filtered = getFilteredLessons();

  const completedLessons = Object.entries(user.progress)
    .filter(([, p]) => p.completed)
    .map(([id, p]) => ({ ...p, lesson: lessons.find(l => l.id === id) }))
    .filter(item => item.lesson);

  const totalCompleted = completedLessons.length;
  const totalLessons = filtered.length;
  const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const avgScore = completedLessons.length > 0
    ? Math.round(completedLessons.reduce((sum, l) => sum + l.accuracy, 0) / completedLessons.length)
    : 0;

  const subjectGroups = SUBJECTS.filter(s => user.selectedSubjects.includes(s.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Progress</h1>
        <p className="text-muted-foreground mt-1">Track your learning journey</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold font-display text-primary">{totalCompleted}/{totalLessons}</p>
            <p className="text-sm text-muted-foreground">Lessons Completed</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold font-display text-xp">{user.points}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold font-display text-info">{avgScore}%</p>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress bar */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Overall Completion</span>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="font-display text-lg">All Lessons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {subjectGroups.map(subject => {
            const subjectLessons = filtered.filter(l => l.subject === subject.id);
            if (subjectLessons.length === 0) return null;
            const subjectCompleted = subjectLessons.filter(l => user.progress[l.id]?.completed).length;
            const subjectProgress = Math.round((subjectCompleted / subjectLessons.length) * 100);

            return (
              <div key={subject.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SubjectIcon icon={subject.icon} className="h-5 w-5 text-foreground" />
                    <h3 className="font-display font-semibold text-sm">{subject.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{subjectCompleted}/{subjectLessons.length} completed</span>
                </div>
                <Progress value={subjectProgress} className="h-2" />
                {subjectLessons.map(lesson => {
                  const prog = user.progress[lesson.id];
                  const isCompleted = prog?.completed;
                  const score = prog?.score ?? 0;
                  const maxScore = lesson.questions.reduce((s, q) => s + q.basePoints, 0);

                  return (
                    <div key={lesson.id} className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-secondary/30">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{lesson.title}</p>
                          {isCompleted && (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{prog!.accuracy}%</Badge>
                              <Badge variant="outline" className="text-xs">{score}/{maxScore}</Badge>
                              {prog!.reviewCompleted && (
                                <Badge className="bg-badge-earned text-accent-foreground text-xs">Reviewed</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Progress value={isCompleted ? 100 : 0} className="h-1.5 mt-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
