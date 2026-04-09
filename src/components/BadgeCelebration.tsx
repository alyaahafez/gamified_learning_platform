import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Award, Star, Zap, RefreshCw, Flame, Mountain, Coins, GraduationCap, Trophy } from 'lucide-react';
import type { Badge } from '@/types/learning';

const badgeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'first-lesson': Trophy,
  'perfect-score': Star,
  'quick-learner': Zap,
  'review-champion': RefreshCw,
  'consistent-learner': Flame,
  'half-way': Mountain,
  'point-collector': Coins,
  'knowledge-master': GraduationCap,
};

interface BadgeCelebrationProps {
  badge: Badge | null;
  onClose: () => void;
}

export function BadgeCelebration({ badge, onClose }: BadgeCelebrationProps) {
  if (!badge) return null;

  const Icon = badgeIconMap[badge.id] || Award;

  return (
    <AnimatePresence mode="wait">
      {badge && (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-6 text-center max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
              className="h-28 w-28 rounded-3xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-2xl shadow-accent/30"
            >
              <Icon className="h-14 w-14 text-accent-foreground" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium text-accent uppercase tracking-wider">Badge Earned!</p>
              <h2 className="font-display text-3xl font-bold">{badge.name}</h2>
              <p className="text-muted-foreground">{badge.earnedReason || badge.description}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button onClick={onClose} size="lg" className="font-medium px-8">
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
