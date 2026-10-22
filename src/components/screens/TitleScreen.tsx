import React, { useEffect } from 'react';
import { Volume2, VolumeX, Music, BookOpen, Smartphone, Users, Share2, Sparkles, Shield, Wifi, Zap } from 'lucide-react';
import { soundFx } from '../../sound/soundFx';

interface TitleScreenProps {
  onStartHost: () => void;
  onStartJoin: () => void;
  onStartPassAndPlay: () => void;
  onOpenRules: () => void;
  onOpenDiagnostics: () => void;
  onOpenSupabaseSettings?: () => void;
  musicMuted: boolean;
  onToggleMusic: () => void;
  sfxMuted: boolean;
  onToggleSfx: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartHost,
  onStartJoin,
  onStartPassAndPlay,
  onOpenRules,
  onOpenDiagnostics,
  onOpenSupabaseSettings,
  musicMuted,
  onToggleMusic,
  sfxMuted,
  onToggleSfx,
}) => {
  // Keyboard listener: Space / Enter to open host setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        soundFx.playClick();
        onStartHost();
      } else if (e.key === 'm' || e.key === 'M') {
        onToggleMusic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartHost, onToggleMusic]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Background Radial Glow & Gradient Mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-600/15 via-blue-600/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Modern Top Header Bar */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center -space-x-1">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase ml-1">
            Local Wi-Fi Card Engine · 2–8 Players
          </span>
        </div>

        {/* Audio Toggles (Music & SFX) */}
        <div className="flex items-center gap-2">
          {/* Music Toggle */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onToggleMusic();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
              !musicMuted
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle Background Music [M]"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music: {!musicMuted ? 'ON' : 'OFF'}</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleSfx();
              if (sfxMuted) soundFx.playClick();
            }}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title="Toggle Sound Effects"
          >
            {sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Hero Centerpiece: Modern Brand Lockup */}
      <main className="relative z-10 my-auto flex flex-col items-center text-center max-w-xl w-full px-2 py-6">
        {/* Floating Mini Decorative Cards */}
        <div className="relative mb-6">
          <div className="w-16 h-24 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 border border-white/20 shadow-xl rotate-[-15deg] absolute -top-8 -left-12 -z-10" />
          <div className="w-16 h-24 rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 border border-white/20 shadow-xl rotate-[15deg] absolute -top-8 -right-12 -z-10" />

          {/* Main Logo Emblem */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-2xl flex items-center justify-center mx-auto">
            <div className="w-full h-full rounded-[14px] bg-slate-950/80 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-amber-400 fill-amber-400/20" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-heading font-black text-4xl sm:text-6xl tracking-tight text-white mb-2 drop-shadow-md">
          CARD <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">CLASH</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 mb-8 max-w-md font-normal leading-relaxed">
          The modern, mobile-friendly multiplayer card game. Host a room on your Wi-Fi for <strong className="text-slate-200 font-semibold">up to 8 real players</strong> with zero bots.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* Host Wi-Fi Room */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onStartHost();
            }}
            className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-bold text-base shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Smartphone className="w-5 h-5" />
            <span>HOST WI-FI ROOM (2–8 PLAYERS)</span>
          </button>

          {/* Join Room */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onStartJoin();
            }}
            className="w-full py-3.5 px-5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-heading font-semibold text-sm border border-slate-700/80 shadow-md flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>JOIN ROOM (ENTER CODE)</span>
          </button>

          {/* Pass and Play Mode */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onStartPassAndPlay();
            }}
            className="w-full py-3 px-5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white font-medium text-xs border border-slate-800 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>PASS & PLAY (2–8 PLAYERS ON 1 DEVICE)</span>
          </button>
        </div>

        {/* Secondary Info Links */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenRules();
            }}
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>GAME RULES</span>
          </button>

          <span className="text-slate-700">·</span>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenDiagnostics();
            }}
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <Wifi className="w-4 h-4" />
            <span>HOST DIAGNOSTICS</span>
          </button>

          {onOpenSupabaseSettings && (
            <>
              <span className="text-slate-700">·</span>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onOpenSupabaseSettings();
                }}
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-semibold"
                title="Configure Supabase Realtime"
              >
                <Zap className="w-4 h-4 fill-emerald-400/20" />
                <span>SUPABASE REALTIME</span>
              </button>
            </>
          )}
        </div>
      </main>

      {/* Flat Footer */}
      <footer className="relative z-10 w-full max-w-4xl py-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 text-center">
        <span>ENTER / SPACE TO START · M TO TOGGLE LO-FI MELODY</span>
        <span>100% BOT FREE · AUTHORITATIVE HUMAN MULTIPLAYER</span>
      </footer>
    </div>
  );
};
