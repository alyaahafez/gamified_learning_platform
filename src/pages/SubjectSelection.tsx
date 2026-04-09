import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { SUBJECTS } from '@/types/learning';
import { SubjectIcon } from '@/components/SubjectIcon';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function SubjectSelection() {
  const { user, selectSubjects } = useGame();
  const [selected, setSelected] = useState<string[]>([]);

  const firstName = user.name.split(' ')[0];

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(SUBJECTS.map(s => s.id));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="font-display text-2xl tracking-tight">
              Welcome, {firstName}!
            </CardTitle>
            <p className="text-muted-foreground text-sm">Choose the subjects you'd like to study. You can always change this later.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUBJECTS.map((subject) => {
                const isSelected = selected.includes(subject.id);
                return (
                  <motion.button
                    key={subject.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggle(subject.id)}
                    className={`relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <SubjectIcon icon={subject.icon} className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{subject.name}</p>
                    </div>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-3 pt-2">
              <Button
                onClick={() => selectSubjects(selected)}
                disabled={selected.length === 0}
                size="lg"
                className="w-full max-w-xs font-medium"
              >
                Continue with {selected.length} subject{selected.length !== 1 ? 's' : ''}
              </Button>
              <button
                onClick={selectAll}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Select all subjects
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
