import { Trophy, Star, Zap, RefreshCw, Flame, Mountain, Coins, GraduationCap, Award } from 'lucide-react';

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

interface BadgeIconProps {
  badgeId: string;
  className?: string;
}

export function BadgeIcon({ badgeId, className = 'h-6 w-6' }: BadgeIconProps) {
  const Icon = badgeIconMap[badgeId] || Award;
  return <Icon className={className} />;
}
