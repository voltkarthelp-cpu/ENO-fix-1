import React from 'react';
import { Sparkles, Moon } from 'lucide-react';
import { CardColor } from '../../types/game';
import { soundFx } from '../../sound/soundFx';

interface WildColorPickerProps {
  onSelectColor: (color: Exclude<CardColor, 'wild' | 'dark_wild'>) => void;
  isDrawFour?: boolean;
  side?: 'light' | 'dark';
}

export const WildColorPicker: React.FC<WildColorPickerProps> = ({
  onSelectColor,
  isDrawFour = false,
  side = 'light',
}) => {
  const lightColors: Array<{ id: Exclude<CardColor, 'wild' | 'dark_wild'>; name: string; bg: string; text: string; shadow: string }> = [
    { id: 'red', name: 'RED', bg: 'bg-gradient-to-br from-rose-500 to-red-700 hover:from-rose-400 hover:to-red-600', text: 'text-white', shadow: 'shadow-rose-950/60' },
    { id: 'blue', name: 'BLUE', bg: 'bg-gradient-to-br from-sky-400 to-blue-700 hover:from-sky-300 hover:to-blue-600', text: 'text-white', shadow: 'shadow-sky-950/60' },
    { id: 'green', name: 'GREEN', bg: 'bg-gradient-to-br from-emerald-400 to-teal-700 hover:from-emerald-300 hover:to-teal-600', text: 'text-white', shadow: 'shadow-emerald-950/60' },
    { id: 'yellow', name: 'YELLOW', bg: 'bg-gradient-to-br from-amber-300 to-yellow-500 hover:from-amber-200 hover:to-yellow-400', text: 'text-slate-950', shadow: 'shadow-amber-950/60' },
  ];

  const darkColors: Array<{ id: Exclude<CardColor, 'wild' | 'dark_wild'>; name: string; bg: string; text: string; shadow: string }> = [
    { id: 'pink', name: 'PINK', bg: 'bg-gradient-to-br from-pink-500 to-rose-700 hover:from-pink-400 hover:to-rose-600', text: 'text-white', shadow: 'shadow-pink-950/60' },
    { id: 'teal', name: 'TEAL', bg: 'bg-gradient-to-br from-cyan-400 to-teal-700 hover:from-cyan-300 hover:to-teal-600', text: 'text-white', shadow: 'shadow-teal-950/60' },
    { id: 'purple', name: 'PURPLE', bg: 'bg-gradient-to-br from-purple-500 to-indigo-800 hover:from-purple-400 hover:to-indigo-700', text: 'text-white', shadow: 'shadow-purple-950/60' },
    { id: 'orange', name: 'ORANGE', bg: 'bg-gradient-to-br from-orange-400 to-amber-600 hover:from-orange-300 hover:to-amber-500', text: 'text-white', shadow: 'shadow-orange-950/60' },
  ];

  const activeColors = side === 'dark' ? darkColors : lightColors;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-sm ${side === 'dark' ? 'bg-slate-950 border-2 border-purple-500/80 shadow-[0_0_50px_rgba(168,85,247,0.4)]' : 'bg-slate-900 border border-slate-800'} rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200`}>
        <div>
          <span className={`text-xs font-bold ${side === 'dark' ? 'text-pink-400' : 'text-amber-400'} uppercase tracking-wider flex items-center justify-center gap-1.5`}>
            {side === 'dark' ? <Moon className="w-4 h-4 text-pink-400" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            <span>{side === 'dark' ? 'Dark Side Wild Choice' : isDrawFour ? 'Wild Draw Four (+4)' : 'Wild Card Played'}</span>
          </span>
          <h2 className="font-heading font-extrabold text-xl text-white mt-1">
            {side === 'dark' ? 'Choose Dark Side Color' : 'Choose Next Active Color'}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3.5 w-full">
          {activeColors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                soundFx.playClick();
                onSelectColor(c.id);
              }}
              className={`py-5 sm:py-6 px-4 rounded-2xl ${c.bg} ${c.text} font-heading font-extrabold text-base shadow-lg ${c.shadow} flex flex-col items-center justify-center gap-2 transform hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20`}
            >
              <div className="w-5 h-5 rounded-full bg-white/30 border border-white/40 shadow-sm" />
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          All other players must match this {side === 'dark' ? 'Dark' : 'Light'} color on subsequent turns.
        </p>
      </div>
    </div>
  );
};
