import { useGame } from '@/context/GameContext';
import { SUBJECTS } from '@/types/learning';
import { SubjectIcon } from '@/components/SubjectIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, BookOpen } from 'lucide-react';

export default function LessonsPage() {
  const { user, getFilteredLessons } = useGame();
  const navigate = useNavigate();
  const filtered = getFilteredLessons();

  const subjectGroups = SUBJECTS.filter(s => user.selectedSubjects.includes(s.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Lessons</h1>
        <p className="text-muted-foreground mt-1">Choose a lesson to start learning</p>
      </div>

      {subjectGroups.map(subject => {
        const subjectLessons = filtered.filter(l => l.subject === subject.id);
        if (subjectLessons.length === 0) return null;

        const categories = [...new Set(subjectLessons.map(l => l.category))];

        return (
          <div key={subject.id} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                <SubjectIcon icon={subject.icon} className="h-5 w-5 text-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold">{subject.name}</h2>
            </div>

            {categories.map(cat => (
              <div key={cat} className="space-y-3 pl-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{cat}</h3>
                <motion.div
                  initial="hidden" animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {subjectLessons.filter(l => l.category === cat).sort((a, b) => a.order - b.order).map(lesson => {
                    const progress = user.progress[lesson.id];
                    const isCompleted = progress?.completed;
                    const score = progress?.score ?? 0;
                    const maxScore = lesson.questions.reduce((s, q) => s + q.basePoints, 0);
                    const progressPercent = isCompleted ? 100 : progress ? (Object.keys(progress.questionAttempts).length / lesson.questions.length) * 100 : 0;

                    return (
                      <motion.div key={lesson.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                        <Card
                          className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-0 shadow-md"
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="font-display text-base">{lesson.title}</CardTitle>
                              {isCompleted && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description}</p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{lesson.questions.length} questions</span>
                              {isCompleted && (
                                <Badge variant="secondary" className="ml-auto text-xs">{score}/{maxScore} pts</Badge>
                              )}
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
