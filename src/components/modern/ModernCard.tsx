import React from 'react';
import { Ban, Repeat, Sparkles, RefreshCw, Flame, Zap, Layers } from 'lucide-react';
import { Card, CardColor, CardType } from '../../types/game';
import { getActiveCardFace } from '../../game/cardEngine';

interface ModernCardProps {
  card?: Card;
  isBack?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isPlayable?: boolean;
  isSelected?: boolean;
  side?: 'light' | 'dark';
  showReverse?: boolean; // For opponent spy preview in UNO Flip
  onClick?: () => void;
  className?: string;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  card,
  isBack = false,
  size = 'md',
  isPlayable = false,
  isSelected = false,
  side = 'light',
  showReverse = false,
  onClick,
  className = '',
}) => {
  const sizeStyles = {
    xs: {
      w: 'w-7 sm:w-9',
      h: 'h-10 sm:h-13',
      corner: 'text-[8px] sm:text-[9px] p-0.5',
      center: 'text-[10px] sm:text-xs',
      iconSize: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
      rounded: 'rounded-md',
    },
    sm: {
      w: 'w-10 sm:w-14',
      h: 'h-15 sm:h-20',
      corner: 'text-[9px] sm:text-[10px] p-0.5 sm:p-1',
      center: 'text-sm sm:text-base',
      iconSize: 'w-3 h-3 sm:w-4 sm:h-4',
      rounded: 'rounded-lg sm:rounded-xl',
    },
    md: {
      w: 'w-14 sm:w-18 md:w-22',
      h: 'h-20 sm:h-26 md:h-32',
      corner: 'text-[10px] sm:text-xs md:text-sm p-0.5 sm:p-1',
      center: 'text-xl sm:text-2xl md:text-3xl',
      iconSize: 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7',
      rounded: 'rounded-xl sm:rounded-2xl',
    },
    lg: {
      w: 'w-14 sm:w-18 md:w-22 lg:w-26',
      h: 'h-21 sm:h-27 md:h-33 lg:h-39',
      corner: 'text-[11px] sm:text-xs md:text-sm p-0.5 sm:p-1',
      center: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
      iconSize: 'w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8',
      rounded: 'rounded-xl sm:rounded-2xl',
    },
  };

  const currentSize = sizeStyles[size];

  // Modern Card Back Rendering
  if (isBack || !card) {
    return (
      <div
        onClick={onClick}
        className={`relative ${currentSize.w} ${currentSize.h} ${currentSize.rounded} ${
          side === 'dark'
            ? 'bg-gradient-to-br from-purple-950 via-slate-950 to-black border-2 border-purple-500/60 ring-1 ring-pink-500/30'
            : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-2 border-slate-700/80'
        } card-shadow flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden transition-all duration-200 ${className}`}
      >
        <div className="absolute inset-1 sm:inset-1.5 rounded-lg sm:rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-slate-950 flex flex-col items-center justify-center p-1 sm:p-2 text-center">
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-amber-400/40 bg-amber-400/10 flex items-center justify-center mb-0.5">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
          </div>
          <span className="font-heading font-extrabold text-[8px] sm:text-[11px] text-amber-400 tracking-wider uppercase leading-tight drop-shadow">
            CARD<br />CLASH
          </span>
        </div>
        <div className="card-gradient-sheen absolute inset-0 pointer-events-none rounded-2xl" />
      </div>
    );
  }

  // Determine which side face to render:
  // In UNO Flip, showReverse flips the active side to display opponent's reverse face
  const activeSide = showReverse ? (side === 'light' ? 'dark' : 'light') : side;
  const face = getActiveCardFace(card, activeSide);

  // Modern Card Gradients & Colors for Light and Dark sides
  const colorStyles: Record<CardColor, { bg: string; border: string; text: string; innerBg: string }> = {
    // Light Side Colors
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
    // Dark Side Colors (UNO Flip)
    pink: {
      bg: 'bg-gradient-to-br from-pink-500 via-rose-600 to-fuchsia-800',
      border: 'border-pink-300/80',
      text: 'text-white',
      innerBg: 'bg-white/20',
    },
    teal: {
      bg: 'bg-gradient-to-br from-cyan-400 via-teal-600 to-emerald-900',
      border: 'border-teal-300/80',
      text: 'text-white',
      innerBg: 'bg-white/20',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 via-violet-700 to-indigo-950',
      border: 'border-purple-300/80',
      text: 'text-white',
      innerBg: 'bg-white/20',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-400 via-amber-600 to-red-800',
      border: 'border-orange-300/80',
      text: 'text-white',
      innerBg: 'bg-white/20',
    },
    dark_wild: {
      bg: 'bg-gradient-to-br from-zinc-950 via-purple-950 to-neutral-900',
      border: 'border-pink-400/90',
      text: 'text-white',
      innerBg: 'bg-white/15',
    },
  };

  const style = colorStyles[face.color] || colorStyles.red;

  // Distinct border based on Side:
  // Light side = crisp white border. Dark side = ominous black border with glow.
  const sideBorder =
    activeSide === 'dark'
      ? 'border-2 sm:border-[3px] border-slate-950 ring-1 ring-purple-500/50 shadow-2xl'
      : 'border-2 sm:border-[3px] border-white shadow-md';

  // Symbol text lookup
  const getSymbol = (type: CardType) => {
    switch (type) {
      case 'skip':
        return '⊘';
      case 'skip_everyone':
        return '⊗';
      case 'reverse':
        return '⇄';
      case 'draw1':
        return '+1';
      case 'draw2':
        return '+2';
      case 'draw5':
        return '+5';
      case 'draw6':
        return '+6';
      case 'draw10':
        return '+10';
      case 'flip':
        return '↻';
      case 'discard_all':
        return '⇊';
      case 'wild':
        return '★';
      case 'wild2':
        return '+2';
      case 'wild4':
        return '+4';
      case 'wild_color':
        return '❖';
      default:
        return type;
    }
  };

  const symbol = getSymbol(face.type);

  const renderCenterGraphic = () => {
    // Flip Card (Iconic UNO Flip feature)
    if (face.type === 'flip') {
      return (
        <div className="flex flex-col items-center justify-center animate-pulse">
          <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-slate-950/80 border border-amber-300/80 flex items-center justify-center shadow-lg mb-0.5">
            <RefreshCw className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <span className="font-heading font-black text-[9px] sm:text-xs tracking-wider text-amber-300 uppercase drop-shadow">
            FLIP
          </span>
        </div>
      );
    }

    // Wild & Dark Wild cards
    if (
      face.color === 'wild' ||
      face.color === 'dark_wild' ||
      face.type === 'wild' ||
      face.type === 'wild2' ||
      face.type === 'wild4' ||
      face.type === 'wild_color' ||
      face.type === 'draw10'
    ) {
      const isDarkWild = activeSide === 'dark' || face.color === 'dark_wild';

      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full p-0.5 shadow-lg bg-slate-950 flex items-center justify-center mb-0.5">
            <div className="w-full h-full rounded-full grid grid-cols-2 overflow-hidden shadow-inner rotate-45">
              {isDarkWild ? (
                <>
                  <div className="bg-pink-500" />
                  <div className="bg-teal-400" />
                  <div className="bg-orange-500" />
                  <div className="bg-purple-600" />
                </>
              ) : (
                <>
                  <div className="bg-rose-500" />
                  <div className="bg-sky-500" />
                  <div className="bg-amber-400" />
                  <div className="bg-emerald-500" />
                </>
              )}
            </div>
          </div>
          <span className="font-heading font-black text-[9px] sm:text-xs text-amber-300 tracking-wider">
            {face.type === 'draw10'
              ? '+10 MERCY'
              : face.type === 'wild_color'
              ? 'WILD COLOR'
              : face.type === 'wild4'
              ? '+4 WILD'
              : face.type === 'wild2'
              ? '+2 WILD'
              : 'WILD'}
          </span>
        </div>
      );
    }

    // Skip Everyone (Dark side & No Mercy)
    if (face.type === 'skip_everyone') {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center -space-x-1">
            <Ban className={`${currentSize.iconSize} text-white drop-shadow-md`} />
            <Ban className={`${currentSize.iconSize} text-amber-300 drop-shadow-md`} />
          </div>
          <span className="mt-0.5 px-1 py-0.2 bg-white text-slate-950 font-heading font-black text-[7px] sm:text-[8px] rounded-full tracking-wider uppercase leading-none shadow-xs">
            SKIP ALL
          </span>
        </div>
      );
    }

    if (face.type === 'skip') {
      return (
        <div className="flex flex-col items-center justify-center">
          <Ban className={`${currentSize.iconSize} text-white drop-shadow-md stroke-[2.5]`} />
          <span className="mt-0.5 px-1.5 py-0.2 bg-white text-slate-950 font-heading font-black text-[7px] sm:text-[8px] rounded-full tracking-wider uppercase leading-none shadow-xs">
            SKIP
          </span>
        </div>
      );
    }

    if (face.type === 'reverse') {
      return (
        <div className="flex flex-col items-center justify-center">
          <Repeat className={`${currentSize.iconSize} text-white drop-shadow-md stroke-[2.5]`} />
          <span className="mt-0.5 px-1.5 py-0.2 bg-white text-slate-950 font-heading font-black text-[7px] sm:text-[8px] rounded-full tracking-wider uppercase leading-none shadow-xs">
            REVERSE
          </span>
        </div>
      );
    }

    // Draw Penalties (+1, +2, +5, +6)
    if (
      face.type === 'draw1' ||
      face.type === 'draw2' ||
      face.type === 'draw5' ||
      face.type === 'draw6'
    ) {
      const label =
        face.type === 'draw1'
          ? '+1'
          : face.type === 'draw2'
          ? '+2'
          : face.type === 'draw5'
          ? '+5'
          : '+6';

      return (
        <div className="flex flex-col items-center justify-center">
          {face.type === 'draw2' ? (
            <div className="relative w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center">
              <div className="w-5 h-7 rounded-sm border-2 border-white bg-white/20 rotate-[-10deg] absolute" />
              <div className="w-5 h-7 rounded-sm border-2 border-white bg-white/30 rotate-[12deg] absolute" />
              <span className="relative z-10 font-heading font-black text-sm sm:text-base text-white drop-shadow-md">
                +2
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 font-heading font-black text-xl sm:text-3xl drop-shadow-md">
              <span>{label}</span>
              {face.type === 'draw5' && <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />}
            </div>
          )}
          <span className="font-heading font-bold text-[7px] sm:text-[9px] tracking-wider uppercase opacity-95">
            {face.type === 'draw5' ? 'DARK DRAW' : 'CARDS'}
          </span>
        </div>
      );
    }

    // Discard All (No Mercy)
    if (face.type === 'discard_all') {
      return (
        <div className="flex flex-col items-center justify-center">
          <Layers className={`${currentSize.iconSize} drop-shadow-md`} />
          <span className="font-heading font-black text-[7px] sm:text-[8px] tracking-wider mt-0.5 text-amber-300 uppercase leading-tight text-center">
            DISCARD<br />ALL
          </span>
        </div>
      );
    }

    // Number Card (0 to 9) with underline for 6 and 9 from custom card grid
    const numStr = (face.value !== undefined ? face.value.toString() : face.type);
    const isUnderlined = numStr === '6' || numStr === '9';

    return (
      <span className={`font-heading font-black ${currentSize.center} drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] tracking-tighter ${isUnderlined ? 'underline decoration-white decoration-2 underline-offset-1' : ''}`}>
        {numStr}
      </span>
    );
  };

  const isUniqueCard =
    face.type === 'flip' ||
    face.type === 'skip_everyone' ||
    face.type === 'draw5' ||
    face.type === 'draw6' ||
    face.type === 'draw10' ||
    face.type === 'discard_all' ||
    face.type === 'wild_color' ||
    face.type === 'wild' ||
    face.type === 'wild2' ||
    face.type === 'wild4' ||
    face.type === 'skip' ||
    face.type === 'reverse' ||
    face.type === 'draw2' ||
    face.type === 'draw1';

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`relative ${currentSize.w} ${currentSize.h} ${currentSize.rounded} ${style.bg} ${sideBorder} card-shadow transition-all duration-200 select-none overflow-hidden ${
        isPlayable
          ? isUniqueCard
            ? 'cursor-pointer hover:-translate-y-3.5 hover:scale-105 active:scale-95 ring-3 ring-amber-300 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse'
            : 'cursor-pointer hover:-translate-y-3 hover:scale-105 active:scale-95 ring-3 ring-amber-300 ring-offset-2 ring-offset-slate-950 card-shadow-hover'
          : 'opacity-85 cursor-not-allowed'
      } ${isSelected ? '-translate-y-4 ring-4 ring-white shadow-2xl' : ''} ${className}`}
    >
      {/* Iconic Tilted Center Oval from Custom Card Grid */}
      <div className="absolute inset-x-1 inset-y-1.5 sm:inset-x-1.5 sm:inset-y-2 rounded-[50%] -rotate-[22deg] bg-black/25 border-[1.5px] sm:border-2 border-white/50 flex items-center justify-center shadow-inner z-0 overflow-hidden">
        <div className={`rotate-[22deg] flex items-center justify-center ${style.text}`}>
          {renderCenterGraphic()}
        </div>
      </div>

      {/* Top Left Corner (Foreground z-30) */}
      <div
        className={`absolute top-0.5 left-0.5 z-30 ${currentSize.corner} font-heading font-black leading-none ${style.text} pointer-events-none select-none`}
      >
        <span className={`drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] filter font-black text-xs sm:text-sm md:text-base tracking-tight ${symbol === '6' || symbol === '9' ? 'underline decoration-white decoration-2 underline-offset-1' : ''}`}>
          {symbol}
        </span>
      </div>

      {/* Bottom Right Corner (Inverted, Foreground z-30) */}
      <div
        className={`absolute bottom-0.5 right-0.5 z-30 ${currentSize.corner} font-heading font-black leading-none rotate-180 ${style.text} pointer-events-none select-none`}
      >
        <span className={`drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] filter font-black text-xs sm:text-sm md:text-base tracking-tight ${symbol === '6' || symbol === '9' ? 'underline decoration-white decoration-2 underline-offset-1' : ''}`}>
          {symbol}
        </span>
      </div>

      {/* Reverse Indicator Badge (when shown as opponent spy face in UNO Flip) */}
      {showReverse && (
        <div className="absolute top-0.5 right-0.5 z-20 bg-slate-950/80 border border-amber-400/80 rounded-full px-1 py-0.2 text-[7px] font-bold text-amber-300 uppercase leading-none shadow">
          {activeSide === 'dark' ? 'DARK' : 'LIGHT'}
        </div>
      )}

      {/* Specular Card Sheen Overlay */}
      <div className="card-gradient-sheen absolute inset-0 pointer-events-none z-20" />
    </div>
  );
};

export { ModernCard as PixelCard };
