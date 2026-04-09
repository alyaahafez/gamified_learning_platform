import { Monitor, Calculator, TrendingUp, Megaphone, Briefcase, BarChart3 } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor,
  Calculator,
  TrendingUp,
  Megaphone,
  Briefcase,
  BarChart3,
};

interface SubjectIconProps {
  icon: string;
  className?: string;
}

export function SubjectIcon({ icon, className = 'h-5 w-5' }: SubjectIconProps) {
  const Icon = iconMap[icon];
  if (!Icon) return null;
  return <Icon className={className} />;
}
