import React from 'react';
import { Flame, Compass, Zap, Shield, Crown, Feather, Sparkles, Moon } from 'lucide-react';
import { AvatarId } from '../../types/game';

interface ModernAvatarProps {
  avatar: AvatarId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isCurrentTurn?: boolean;
  hasOneCard?: boolean;
  cardCount?: number;
  className?: string;
}

export const AVATAR_METADATA: Record<AvatarId, { name: string; gradient: string; border: string; icon: React.ElementType }> = {
  fox: { name: 'Ember Fox', gradient: 'from-orange-500 to-red-600', border: 'border-orange-500', icon: Flame },
  falcon: { name: 'Sky Falcon', gradient: 'from-sky-400 to-blue-600', border: 'border-blue-400', icon: Compass },
  tiger: { name: 'Golden Tiger', gradient: 'from-amber-400 to-yellow-600', border: 'border-amber-400', icon: Zap },
  dragon: { name: 'Jade Dragon', gradient: 'from-emerald-400 to-teal-700', border: 'border-emerald-400', icon: Shield },
  bear: { name: 'Royal Bear', gradient: 'from-purple-500 to-indigo-800', border: 'border-purple-400', icon: Crown },
  wolf: { name: 'Frost Wolf', gradient: 'from-cyan-400 to-blue-800', border: 'border-cyan-400', icon: Moon },
  viper: { name: 'Neon Viper', gradient: 'from-lime-400 to-emerald-600', border: 'border-lime-400', icon: Feather },
  phoenix: { name: 'Solar Phoenix', gradient: 'from-pink-500 to-rose-700', border: 'border-rose-400', icon: Sparkles },
};

export const ModernAvatar: React.FC<ModernAvatarProps> = ({
  avatar,
  size = 'md',
  isCurrentTurn = false,
  hasOneCard = false,
  cardCount,
  className = '',
}) => {
  const meta = AVATAR_METADATA[avatar] || AVATAR_METADATA.fox;
  const IconComponent = meta.icon;

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Avatar Circle Container */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${meta.gradient} p-0.5 shadow-md flex items-center justify-center transition-all duration-300 ${
          isCurrentTurn
            ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-950 scale-105 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
            : 'border border-white/20'
        }`}
      >
        <div className="w-full h-full rounded-full bg-slate-950/40 backdrop-blur-xs flex items-center justify-center text-white">
          <IconComponent className={iconSizes[size]} />
        </div>
      </div>

      {/* Sweating / 1 card left alert badge */}
      {hasOneCard && (
        <span
          className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full border border-white shadow-md animate-bounce"
          title="1 Card Left! (UNO!)"
        >
          1!
        </span>
      )}

      {/* Turn indicator pulse */}
      {isCurrentTurn && (
        <span className="absolute -bottom-1 bg-yellow-400 text-slate-950 font-bold text-[9px] uppercase px-1.5 py-0.2 rounded-full tracking-wider shadow">
          TURN
        </span>
      )}
    </div>
  );
};

export { ModernAvatar as PixelAvatar };
