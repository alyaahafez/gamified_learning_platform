import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { pointsForNextLevel, SUBJECTS } from '@/types/learning';
import { SubjectIcon } from '@/components/SubjectIcon';
import { BadgeIcon } from '@/components/BadgeIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogOut, Award, Star, Flame, BookOpen, Trophy, Target, CheckCircle2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, logout, getFilteredLessons, updateSubjects } = useGame();
  const navigate = useNavigate();
  const [showSubjectEditor, setShowSubjectEditor] = useState(false);
  const [editedSubjects, setEditedSubjects] = useState<string[]>(user.selectedSubjects);

  const firstName = user.name.split(' ')[0];
  const nextLevelPoints = pointsForNextLevel(user.level);
  const prevLevelPoints = pointsForNextLevel(user.level - 1);
  const levelProgress = ((user.points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100;

  const earnedBadges = user.badges.filter(b => b.earned);
  const selectedSubjectNames = SUBJECTS.filter(s => user.selectedSubjects.includes(s.id));
  const filtered = getFilteredLessons();
  const completedCount = Object.values(user.progress).filter(p => p.completed).length;
  const totalLessons = filtered.length;
  const completedLessons = Object.entries(user.progress).filter(([, p]) => p.completed);
  const avgFirstAttempt = completedLessons.length > 0
    ? Math.round(completedLessons.reduce((sum, [, p]) => sum + p.accuracy, 0) / completedLessons.length)
    : 0;
  const reviewsDone = Object.values(user.progress).filter(p => p.reviewCompleted).length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSubject = (id: string) => {
    setEditedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const saveSubjects = () => {
    if (editedSubjects.length > 0) {
      updateSubjects(editedSubjects);
      setShowSubjectEditor(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Profile Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/5" />
        <CardContent className="pt-0 -mt-10">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 border-4 border-card">
              <span className="text-primary-foreground font-display text-3xl font-bold">
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 pb-1">
              <h1 className="font-display text-2xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Log Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Level Progress */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Level {user.level}</span>
            </div>
            <span className="text-sm text-muted-foreground">{user.points} / {nextLevelPoints} XP</span>
          </div>
          <Progress value={Math.min(levelProgress, 100)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">{nextLevelPoints - user.points} points to Level {user.level + 1}</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { icon: Star, label: 'Total Points', value: user.points, color: 'text-primary' },
          { icon: Flame, label: 'Streak', value: user.streak, color: 'text-streak' },
          { icon: BookOpen, label: 'Completed', value: `${completedCount}/${totalLessons}`, color: 'text-info' },
          { icon: Target, label: 'Avg Score', value: `${avgFirstAttempt}%`, color: 'text-accent' },
        ].map(stat => (
          <Card key={stat.label} className="border-0 shadow-md">
            <CardContent className="pt-5 pb-4 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-bold font-display">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Badges Earned */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Award className="h-5 w-5 text-accent" />
            Badges Earned ({earnedBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedBadges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No badges earned yet. Complete lessons to unlock badges!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {earnedBadges.map(badge => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 rounded-full bg-primary/5 border border-primary/10 px-3 py-2"
                >
                  <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <BadgeIcon badgeId={badge.id} className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium">{badge.name}</span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Subjects */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base">Your Subjects</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { setEditedSubjects(user.selectedSubjects); setShowSubjectEditor(true); }} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedSubjectNames.map(s => (
              <Badge key={s.id} variant="secondary" className="text-sm py-1.5 px-3 gap-1.5">
                <SubjectIcon icon={s.icon} className="h-3.5 w-3.5" />
                {s.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Summary */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Learning Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-2xl font-bold font-display text-primary">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Lessons Done</p>
            </div>
            <div className="rounded-xl bg-accent/5 p-4 text-center">
              <p className="text-2xl font-bold font-display text-accent">{reviewsDone}</p>
              <p className="text-xs text-muted-foreground mt-1">Reviews Done</p>
            </div>
            <div className="rounded-xl bg-info/5 p-4 text-center">
              <p className="text-2xl font-bold font-display text-info">{avgFirstAttempt}%</p>
              <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
            </div>
            <div className="rounded-xl bg-streak/5 p-4 text-center">
              <p className="text-2xl font-bold font-display text-streak">{earnedBadges.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Badges</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Editor Dialog */}
      <Dialog open={showSubjectEditor} onOpenChange={setShowSubjectEditor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Subjects</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {SUBJECTS.map(subject => {
              const isSelected = editedSubjects.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <SubjectIcon icon={subject.icon} className="h-5 w-5" />
                  <span className="flex-1 text-sm font-medium">{subject.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
            <Button onClick={saveSubjects} disabled={editedSubjects.length === 0} className="w-full mt-2">
              Save ({editedSubjects.length} selected)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
