import React from 'react';
import { 
  Play, 
  Clock, 
  Flame, 
  Check,
  CheckCircle2,
  CheckSquare, 
  CheckCheck, 
  Zap, 
  Award, 
  Sparkles, 
  Trophy, 
  Crown, 
  TrendingUp, 
  Star, 
  Target, 
  BookOpen,
  Medal,
  Shield,
  ShieldCheck,
  Timer,
  Hourglass,
  Brain,
  Compass,
  LucideProps
} from 'lucide-react';

interface BadgeIconProps extends LucideProps {
  iconName: string;
}

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  Play,
  Clock,
  Flame,
  Check,
  CheckCircle2,
  CheckSquare,
  CheckCheck,
  Zap,
  Award,
  Sparkles,
  Trophy,
  Crown,
  TrendingUp,
  Star,
  Target,
  BookOpen,
  Medal,
  Shield,
  ShieldCheck,
  Timer,
  Hourglass,
  Brain,
  Compass,
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({ iconName, ...props }) => {
  const IconComponent = ICON_MAP[iconName] || Award;
  return <IconComponent {...props} />;
};
