import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { BookOpen, LogOut, User } from 'lucide-react';
import { BadgeCelebration } from '@/components/BadgeCelebration';
import { LevelUpCelebration } from '@/components/LevelUpCelebration';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { pointsForNextLevel } from '@/types/learning';

export default function AppLayout() {
  const { user, newlyEarnedBadge, dismissBadge, levelUpLevel, dismissLevelUp, logout } = useGame();
  const navigate = useNavigate();

  const firstName = user.name.split(' ')[0];
  const nextLevelPoints = pointsForNextLevel(user.level);
  const prevLevelPoints = pointsForNextLevel(user.level - 1);
  const levelProgress = ((user.points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b border-border/50 px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg">LearnQuest</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block">Level {user.level} • {user.points} XP</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <span className="text-xs font-bold text-primary">{firstName.charAt(0).toUpperCase()}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                      <span className="text-primary-foreground font-display text-lg font-bold">{firstName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Level {user.level}</span>
                      <span className="text-muted-foreground">{user.points}/{nextLevelPoints} XP</span>
                    </div>
                    <Progress value={Math.min(levelProgress, 100)} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-secondary p-2">
                      <p className="text-sm font-bold">{user.points}</p>
                      <p className="text-[10px] text-muted-foreground">Points</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-2">
                      <p className="text-sm font-bold">{user.streak}</p>
                      <p className="text-[10px] text-muted-foreground">Streak</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-2">
                      <p className="text-sm font-bold">{user.lessonsCompleted}</p>
                      <p className="text-[10px] text-muted-foreground">Lessons</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => navigate('/profile')}>
                      <User className="h-3.5 w-3.5" /> View Profile
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleLogout}>
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <BadgeCelebration badge={newlyEarnedBadge} onClose={dismissBadge} />
      <LevelUpCelebration level={levelUpLevel} onClose={dismissLevelUp} />
    </SidebarProvider>
  );
}
