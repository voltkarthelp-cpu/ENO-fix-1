import React, { useEffect, useState } from 'react';
import { Ban, Repeat, AlertTriangle, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { CardColor } from '../../types/game';

interface ActionCardOverlayProps {
  lastActionMessage: string;
  lastActionType?: 'play' | 'draw' | 'skip' | 'reverse' | 'penalty' | 'uno' | 'wild' | 'flip' | 'mercy';
  activeColor: CardColor;
  currentSide?: 'light' | 'dark';
}

export const ActionCardOverlay: React.FC<ActionCardOverlayProps> = ({
  lastActionMessage,
  lastActionType,
  activeColor,
  currentSide = 'light',
}) => {
  const [visible, setVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  useEffect(() => {
    // Only trigger for special action types
    if (
      lastActionType === 'skip' ||
      lastActionType === 'reverse' ||
      lastActionType === 'penalty' ||
      lastActionType === 'wild' ||
      lastActionType === 'uno' ||
      lastActionType === 'flip' ||
      lastActionType === 'mercy'
    ) {
      setCurrentAction(lastActionType);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
      }, 1900);

      return () => clearTimeout(timer);
    }
  }, [lastActionMessage, lastActionType]);

  if (!visible || !currentAction) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center p-4">
      {/* Background ripple / flash */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150" />

      {/* Skip Card Animation */}
      {currentAction === 'skip' && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-200">
          <div className="w-24 h-24 rounded-full bg-rose-600/90 border-4 border-rose-300 shadow-[0_0_50px_rgba(244,63,94,0.7)] flex items-center justify-center mb-3 animate-bounce">
            <Ban className="w-14 h-14 text-white stroke-[2.5]" />
          </div>
          <div className="bg-rose-950/90 border-2 border-rose-500 text-white font-heading font-black text-2xl sm:text-3xl px-6 py-2 rounded-2xl shadow-2xl tracking-wider uppercase">
            TURN SKIPPED!
          </div>
        </div>
      )}

      {/* Reverse Card Animation */}
      {currentAction === 'reverse' && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-200">
          <div className="w-24 h-24 rounded-full bg-sky-600/90 border-4 border-sky-300 shadow-[0_0_50px_rgba(56,189,248,0.7)] flex items-center justify-center mb-3 animate-spin duration-700">
            <Repeat className="w-14 h-14 text-white stroke-[2.5]" />
          </div>
          <div className="bg-sky-950/90 border-2 border-sky-500 text-white font-heading font-black text-2xl sm:text-3xl px-6 py-2 rounded-2xl shadow-2xl tracking-wider uppercase">
            PLAY REVERSED!
          </div>
        </div>
      )}

      {/* Draw Penalty / Stacking Animation */}
      {currentAction === 'penalty' && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-200">
          <div className="w-24 h-24 rounded-full bg-amber-500/95 border-4 border-amber-300 shadow-[0_0_60px_rgba(245,158,11,0.8)] flex items-center justify-center mb-3 animate-pulse">
            <Flame className="w-14 h-14 text-slate-950 fill-current" />
          </div>
          <div className="bg-amber-950/95 border-2 border-amber-400 text-amber-200 font-heading font-black text-2xl sm:text-3xl px-6 py-2 rounded-2xl shadow-2xl tracking-wider uppercase">
            PENALTY CARDS!
          </div>
        </div>
      )}

      {/* Wild Card Animation */}
      {currentAction === 'wild' && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-200">
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-400 shadow-[0_0_60px_rgba(251,191,36,0.8)] mb-3 animate-spin duration-1000">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-amber-300 fill-amber-300" />
            </div>
          </div>
          <div className="bg-slate-950/95 border-2 border-amber-400 text-white font-heading font-black text-2xl sm:text-3xl px-6 py-2 rounded-2xl shadow-2xl tracking-wider uppercase">
            COLOR CHANGED TO {activeColor.toUpperCase()}!
          </div>
        </div>
      )}

      {/* UNO Called Animation */}
      {currentAction === 'uno' && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-200">
          <div className="w-24 h-24 rounded-full bg-red-600/95 border-4 border-yellow-300 shadow-[0_0_70px_rgba(239,68,68,0.9)] flex items-center justify-center mb-3 animate-pulse">
            <ShieldAlert className="w-14 h-14 text-white fill-current" />
          </div>
          <div className="bg-red-950/95 border-2 border-yellow-400 text-yellow-300 font-heading font-black text-3xl sm:text-4xl px-8 py-3 rounded-2xl shadow-2xl tracking-widest uppercase animate-bounce">
            🚨 UNO! 🚨
          </div>
        </div>
      )}

      {/* UNO Flip Animation */}
      {currentAction === 'flip' && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-300">
          <div className="w-28 h-28 rounded-full p-1.5 bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-300 shadow-[0_0_80px_rgba(236,72,153,0.9)] mb-3 animate-spin duration-1000">
            <div className="w-full h-full rounded-full bg-slate-950 border-2 border-white flex items-center justify-center">
              <span className="font-heading font-black text-3xl text-amber-300 animate-pulse">↻</span>
            </div>
          </div>
          <div className="bg-slate-950/95 border-3 border-pink-400 text-pink-300 font-heading font-black text-2xl sm:text-4xl px-8 py-3 rounded-2xl shadow-2xl tracking-wider uppercase animate-bounce">
            {currentSide === 'dark' ? '🌌 ENTERING THE DARK SIDE! 🌌' : '☀️ RETURNING TO LIGHT SIDE! ☀️'}
          </div>
        </div>
      )}

      {/* No Mercy Knockout Animation */}
      {currentAction === 'mercy' && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center animate-in zoom-in-75 duration-200">
          <div className="w-24 h-24 rounded-full bg-red-700 border-4 border-yellow-400 shadow-[0_0_80px_rgba(220,38,38,0.9)] flex items-center justify-center mb-3 animate-pulse">
            <AlertTriangle className="w-14 h-14 text-yellow-300 fill-current" />
          </div>
          <div className="bg-red-950/95 border-2 border-yellow-400 text-yellow-200 font-heading font-black text-2xl sm:text-3xl px-8 py-3 rounded-2xl shadow-2xl tracking-wider uppercase">
            ☠ MERCY RULE KNOCKOUT! ☠
          </div>
        </div>
      )}
    </div>
  );
};
