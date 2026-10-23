import React from 'react';
import { Ban, Repeat, Layers, Sparkles } from 'lucide-react';
import { Card, CardColor, CardType } from '../../types/game';

interface ModernCardProps {
  card?: Card;
  isBack?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  card,
  isBack = false,
  size = 'md',
  isPlayable = false,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const sizeStyles = {
    xs: {
      w: 'w-10 sm:w-11',
      h: 'h-14 sm:h-16',
      corner: 'text-[11px] p-1',
      center: 'text-sm',
      iconSize: 'w-3.5 h-3.5',
      rounded: 'rounded-lg',
    },
    sm: {
      w: 'w-14 sm:w-16',
      h: 'h-20 sm:h-24',
      corner: 'text-xs p-1.5',
      center: 'text-xl',
      iconSize: 'w-5 h-5',
      rounded: 'rounded-xl',
    },
    md: {
      w: 'w-20 sm:w-24',
      h: 'h-28 sm:h-34',
      corner: 'text-sm p-2',
      center: 'text-3xl',
      iconSize: 'w-8 h-8',
      rounded: 'rounded-2xl',
    },
    lg: {
      w: 'w-24 sm:w-28 md:w-32',
      h: 'h-36 sm:h-42 md:h-48',
      corner: 'text-base p-2.5',
      center: 'text-4xl sm:text-5xl',
      iconSize: 'w-10 h-10',
      rounded: 'rounded-2xl',
    },
  };

  const currentSize = sizeStyles[size];

  // Modern Card Back Rendering
  if (isBack || !card) {
    return (
      <div
        onClick={onClick}
        className={`relative ${currentSize.w} ${currentSize.h} ${currentSize.rounded} bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-2 border-slate-700/80 card-shadow flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden transition-all duration-200 ${className}`}
      >
        {/* Subtle geometric background pattern */}
        <div className="absolute inset-1.5 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-slate-950 flex flex-col items-center justify-center p-2 text-center">
          <div className="w-8 h-8 rounded-full border border-amber-400/40 bg-amber-400/10 flex items-center justify-center mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <span className="font-heading font-extrabold text-[10px] sm:text-xs text-amber-400 tracking-wider uppercase leading-tight drop-shadow">
            CARD<br />CLASH
          </span>
        </div>
        {/* Glossy specular sheen */}
        <div className="card-gradient-sheen absolute inset-0 pointer-events-none rounded-2xl" />
      </div>
    );
  }

  // Modern Card Gradients & Colors
  const colorStyles: Record<CardColor, { bg: string; border: string; text: string; innerBg: string }> = {
    red: {
      bg: 'bg-gradient-to-br from-rose-500 via-red-600 to-red-700',
      border: 'border-red-400/50',
      text: 'text-white',
      innerBg: 'bg-white/15',
    },
    blue: {
      bg: 'bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-700',
      border: 'border-sky-300/50',
      text: 'text-white',
      innerBg: 'bg-white/15',
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800',
      border: 'border-emerald-300/50',
      text: 'text-white',
      innerBg: 'bg-white/15',
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500',
      border: 'border-amber-200/60',
      text: 'text-slate-950',
      innerBg: 'bg-black/10',
    },
    wild: {
      bg: 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900',
      border: 'border-amber-400/70',
      text: 'text-white',
      innerBg: 'bg-white/10',
    },
  };

  const style = colorStyles[card.color];

  // Symbol text and center graphic
  const getSymbol = (type: CardType) => {
    switch (type) {
      case 'skip':
        return '⊘';
      case 'reverse':
        return '⇄';
      case 'draw2':
        return '+2';
      case 'wild':
        return '★';
      case 'wild4':
        return '+4';
      default:
        return type;
    }
  };

  const symbol = getSymbol(card.type);

  const renderCenterGraphic = () => {
    if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
      return (
        <div className="flex flex-col items-center justify-center">
          {/* Modern 4-quadrant radiant orb */}
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full p-0.5 shadow-lg bg-slate-950 flex items-center justify-center mb-1">
            <div className="w-full h-full rounded-full grid grid-cols-2 overflow-hidden shadow-inner rotate-45">
              <div className="bg-rose-500" />
              <div className="bg-sky-500" />
              <div className="bg-amber-400" />
              <div className="bg-emerald-500" />
            </div>
          </div>
          <span className="font-heading font-extrabold text-[10px] sm:text-xs text-amber-300 tracking-wider">
            {card.type === 'wild4' ? '+4 WILD' : 'WILD'}
          </span>
        </div>
      );
    }

    if (card.type === 'skip') {
      return (
        <div className="flex flex-col items-center justify-center">
          <Ban className={`${currentSize.iconSize} drop-shadow-md`} />
          <span className="font-heading font-bold text-[9px] sm:text-xs tracking-wider mt-0.5">SKIP</span>
        </div>
      );
    }

    if (card.type === 'reverse') {
      return (
        <div className="flex flex-col items-center justify-center">
          <Repeat className={`${currentSize.iconSize} drop-shadow-md`} />
          <span className="font-heading font-bold text-[9px] sm:text-xs tracking-wider mt-0.5">REVERSE</span>
        </div>
      );
    }

    if (card.type === 'draw2') {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-0.5 font-heading font-black text-2xl sm:text-3xl drop-shadow-md">
            <span>+2</span>
          </div>
          <span className="font-heading font-bold text-[9px] sm:text-[10px] tracking-wider uppercase opacity-90">
            CARDS
          </span>
        </div>
      );
    }

    // Number Card
    return (
      <span className={`font-heading font-black ${currentSize.center} drop-shadow-md tracking-tighter`}>
        {card.value ?? card.type}
      </span>
    );
  };

  const isUniqueCard =
    card && (card.type === 'wild' || card.type === 'wild4' || card.type === 'skip' || card.type === 'reverse' || card.type === 'draw2');

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`relative ${currentSize.w} ${currentSize.h} ${currentSize.rounded} ${style.bg} ${style.border} border-2 card-shadow transition-all duration-200 select-none overflow-hidden ${
        isPlayable
          ? isUniqueCard
            ? 'cursor-pointer hover:-translate-y-3.5 hover:scale-105 active:scale-95 ring-3 ring-amber-300 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse'
            : 'cursor-pointer hover:-translate-y-3 hover:scale-105 active:scale-95 ring-3 ring-amber-300 ring-offset-2 ring-offset-slate-950 card-shadow-hover'
          : 'opacity-75 saturate-70 cursor-not-allowed'
      } ${isSelected ? '-translate-y-4 ring-4 ring-white shadow-2xl' : ''} ${className}`}
    >
      {/* Center Ellipse Capsule (rendered under the corners) */}
      <div className="absolute inset-2 sm:inset-3 rounded-xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shadow-inner z-0">
        <div className={style.text}>
          {renderCenterGraphic()}
        </div>
      </div>

      {/* Top Left Corner (strictly foreground z-10 like bottom-right) */}
      <div
        className={`absolute top-0 left-0 z-10 ${currentSize.corner} font-heading font-black leading-none ${style.text} pointer-events-none`}
      >
        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] filter font-black text-sm sm:text-base tracking-tight">
          {symbol}
        </span>
      </div>

      {/* Bottom Right Corner (Inverted, foreground z-10) */}
      <div
        className={`absolute bottom-0 right-0 z-10 ${currentSize.corner} font-heading font-black leading-none rotate-180 ${style.text} pointer-events-none`}
      >
        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] filter font-black text-sm sm:text-base tracking-tight">
          {symbol}
        </span>
      </div>

      {/* Specular Card Sheen Overlay */}
      <div className="card-gradient-sheen absolute inset-0 pointer-events-none z-20" />
    </div>
  );
};

export { ModernCard as PixelCard };
