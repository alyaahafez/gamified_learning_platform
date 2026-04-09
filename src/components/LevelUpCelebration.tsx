import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { useMemo } from 'react';

const CONFETTI_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(45, 93%, 58%)',
  'hsl(340, 82%, 59%)',
  'hsl(200, 98%, 48%)',
  'hsl(150, 80%, 50%)',
  'hsl(280, 80%, 60%)',
];

const SHAPES = ['circle', 'square', 'triangle'] as const;

function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 2,
    size: 6 + Math.random() * 10,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 60,
  }));
}

function ConfettiPiece({ piece }: { piece: ReturnType<typeof generateConfetti>[0] }) {
  const shapeStyle: React.CSSProperties =
    piece.shape === 'triangle'
      ? {
          width: 0,
          height: 0,
          borderLeft: `${piece.size / 2}px solid transparent`,
          borderRight: `${piece.size / 2}px solid transparent`,
          borderBottom: `${piece.size}px solid ${piece.color}`,
          background: 'none',
        }
      : {
          width: piece.size,
          height: piece.size,
          background: piece.color,
          borderRadius: piece.shape === 'circle' ? '50%' : '2px',
        };

  return (
    <motion.div
      initial={{
        top: '-5%',
        left: `${piece.x}%`,
        opacity: 1,
        rotate: 0,
        scale: 0,
      }}
      animate={{
        top: '110%',
        left: `${piece.x + piece.drift}%`,
        opacity: [1, 1, 0.8, 0],
        rotate: piece.rotation + 720,
        scale: [0, 1.2, 1, 0.8],
      }}
      transition={{
        duration: piece.duration,
        delay: piece.delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="absolute pointer-events-none"
      style={shapeStyle}
    />
  );
}

interface LevelUpCelebrationProps {
  level: number | null;
  onClose: () => void;
}

export function LevelUpCelebration({ level, onClose }: LevelUpCelebrationProps) {
  const confetti = useMemo(() => (level ? generateConfetti(50) : []), [level]);

  return (
    <AnimatePresence mode="wait">
      {level && (
        <motion.div
          key={`level-${level}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md overflow-hidden"
          onClick={onClose}
        >
          {/* Confetti layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti.map(piece => (
              <ConfettiPiece key={piece.id} piece={piece} />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-6 text-center max-w-sm mx-4 relative z-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Glow ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.6, 1.3], opacity: [0, 0.4, 0.15] }}
              transition={{ delay: 0.1, duration: 1, ease: 'easeOut' }}
              className="absolute top-0 h-28 w-28 rounded-3xl bg-primary blur-2xl"
            />

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
              className="h-28 w-28 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl shadow-primary/30 relative"
            >
              <span className="font-display text-4xl font-bold text-primary-foreground">{level}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium text-primary uppercase tracking-wider flex items-center justify-center gap-1">
                <ArrowUp className="h-4 w-4" /> Level Up!
              </p>
              <h2 className="font-display text-3xl font-bold">Level {level}</h2>
              <p className="text-muted-foreground">Keep going — you're making great progress!</p>
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
