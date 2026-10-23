import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  BookOpen,
  LogOut,
  Sparkles,
  AlertCircle,
  Bell,
  AlertTriangle,
  Zap,
  Mic,
  MicOff,
  Moon,
  RefreshCw,
  Skull,
  Eye,
} from 'lucide-react';
import { Card, CardColor, GameTableState } from '../../types/game';
import { ModernCard } from '../modern/ModernCard';
import { ModernAvatar } from '../modern/ModernAvatar';
import { WildColorPicker } from './WildColorPicker';
import { RoundEndModal } from './RoundEndModal';
import { ActionCardOverlay } from '../common/ActionCardOverlay';
import { PixelParticles } from '../pixel/PixelParticles';
import { isCardPlayable } from '../../game/cardEngine';
import { soundFx } from '../../sound/soundFx';

interface GameTableProps {
  tableState: GameTableState;
  localPlayerId: string;
  isHost: boolean;
  onPlayCard: (cardId: string, chosenColor?: CardColor, calledUno?: boolean) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onCatchUno: (targetPlayerId: string) => void;
  onNextRound: () => void;
  onRestartMatch: () => void;
  onOpenRules: () => void;
  onOpenSupabaseSettings?: () => void;
  onLeaveGame: () => void;
  musicMuted: boolean;
  onToggleMusic: () => void;
  sfxMuted: boolean;
  onToggleSfx: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  tableState,
  localPlayerId,
  isHost,
  onPlayCard,
  onDrawCard,
  onCallUno,
  onCatchUno,
  onNextRound,
  onRestartMatch,
  onOpenRules,
  onOpenSupabaseSettings,
  onLeaveGame,
  musicMuted,
  onToggleMusic,
  sfxMuted,
  onToggleSfx,
}) => {
  const [selectedWildCard, setSelectedWildCard] = useState<Card | null>(null);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particleType, setParticleType] = useState<'burst' | 'victory' | 'wild'>('burst');
  const [voiceMuted, setVoiceMuted] = useState(soundFx.isVoiceMuted());
  const [peekReverse, setPeekReverse] = useState(false);

  const {
    players,
    currentPlayerIndex,
    direction,
    discardPile,
    drawPileCount,
    activeColor,
    pendingDrawPenalty,
    unoCallPendingPlayerId,
    lastActionMessage,
    roundNumber,
    rules,
  } = tableState;

  const currentSide = tableState.currentSide || 'light';
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === localPlayerId;
  const localPlayer = players.find((p) => p.id === localPlayerId) || players[0];
  const topDiscard = discardPile[discardPile.length - 1];

  // Up to 7 opponents
  const opponents = players.filter((p) => p.id !== localPlayer.id);

  // Track previous turn to trigger audio and voice alerts when turn begins
  const wasMyTurnRef = useRef(false);
  useEffect(() => {
    if (isMyTurn && !wasMyTurnRef.current) {
      soundFx.playTurnAlert();
      soundFx.speakTurn();
    }
    wasMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  // Voice announcements for special actions
  const prevActionRef = useRef<string>('');
  useEffect(() => {
    if (!tableState.lastActionMessage || tableState.lastActionMessage === prevActionRef.current) return;
    prevActionRef.current = tableState.lastActionMessage;

    if (tableState.lastActionType === 'skip') {
      soundFx.speakSkip();
    } else if (tableState.lastActionType === 'reverse') {
      soundFx.speakReverse();
    } else if (tableState.lastActionType === 'penalty') {
      if (tableState.lastActionMessage?.includes('caught')) {
        soundFx.speak('Caught! Penalty cards applied!');
      } else {
        soundFx.speakDraw(tableState.pendingDrawPenalty || 2);
      }
    } else if (tableState.lastActionType === 'wild') {
      soundFx.speakWild(tableState.activeColor);
    } else if (tableState.lastActionType === 'uno') {
      soundFx.speakUno();
    } else if (tableState.lastActionType === 'flip') {
      soundFx.speakFlip(currentSide);
    }
  }, [tableState.lastActionMessage, tableState.lastActionType, tableState.pendingDrawPenalty, tableState.activeColor, currentSide]);

  // Particle feedback on move changes
  useEffect(() => {
    if (tableState.lastActionType === 'wild' || tableState.lastActionType === 'flip') {
      setParticleType('wild');
      setParticleTrigger((k) => k + 1);
    } else if (tableState.lastActionType === 'uno') {
      setParticleType('burst');
      setParticleTrigger((k) => k + 1);
    }
  }, [tableState.lastActionMessage, tableState.lastActionType]);

  // Handle clicking a card in player hand
  const handleCardClick = (card: Card) => {
    if (!isMyTurn) return;

    const playable = isCardPlayable(
      card,
      activeColor,
      topDiscard,
      pendingDrawPenalty,
      rules.stacking,
      currentSide,
      localPlayer.hand
    );
    if (!playable) {
      soundFx.playError();
      return;
    }

    // If Wild or Wild 4 or Wild Color, prompt for color selection
    if (
      card.color === 'wild' ||
      card.color === 'dark_wild' ||
      card.type === 'wild' ||
      card.type === 'wild2' ||
      card.type === 'wild4' ||
      card.type === 'wild_color' ||
      card.type === 'draw10'
    ) {
      setSelectedWildCard(card);
      soundFx.playClick();
      return;
    }

    // Normal play
    onPlayCard(card.id, undefined, false);
  };

  const handleWildColorSelected = (chosenColor: Exclude<CardColor, 'wild' | 'dark_wild'>) => {
    if (!selectedWildCard) return;
    onPlayCard(selectedWildCard.id, chosenColor, false);
    setSelectedWildCard(null);
  };

  const handleToggleVoice = () => {
    const isNowMuted = soundFx.toggleVoice();
    setVoiceMuted(isNowMuted);
    if (!isNowMuted) soundFx.playClick();
  };

  // Color border / highlight mapping for active color
  const activeColorTheme: Record<CardColor, { bg: string; text: string; ring: string }> = {
    red: { bg: 'bg-rose-600', text: 'text-rose-400', ring: 'border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-400', ring: 'border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
    green: { bg: 'bg-emerald-600', text: 'text-emerald-400', ring: 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
    yellow: { bg: 'bg-amber-400', text: 'text-amber-400', ring: 'border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]' },
    wild: { bg: 'bg-purple-600', text: 'text-purple-400', ring: 'border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
    pink: { bg: 'bg-pink-600', text: 'text-pink-400', ring: 'border-pink-500/90 shadow-[0_0_25px_rgba(236,72,153,0.5)]' },
    teal: { bg: 'bg-teal-600', text: 'text-teal-400', ring: 'border-teal-500/90 shadow-[0_0_25px_rgba(20,184,166,0.5)]' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-400', ring: 'border-purple-500/90 shadow-[0_0_25px_rgba(168,85,247,0.5)]' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-400', ring: 'border-orange-500/90 shadow-[0_0_25px_rgba(249,115,22,0.5)]' },
    dark_wild: { bg: 'bg-purple-700', text: 'text-pink-300', ring: 'border-pink-400/90 shadow-[0_0_25px_rgba(236,72,153,0.5)]' },
  };

  // Check if someone can be caught forgetting UNO
  const caughtTargetPlayer = unoCallPendingPlayerId
    ? players.find((p) => p.id === unoCallPendingPlayerId && p.id !== localPlayer.id)
    : null;

  const currentTheme = activeColorTheme[activeColor] || activeColorTheme.red;

  return (
    <div className={`relative h-[100dvh] max-h-[100dvh] w-full ${currentSide === 'dark' ? 'bg-black text-slate-100' : 'bg-slate-950 text-slate-100'} flex flex-col justify-between overflow-hidden select-none transition-colors duration-500`}>
      {/* Visual Particle Overlay */}
      <PixelParticles triggerKey={particleTrigger} type={particleType} />

      {/* Action Card Dramatic Centerpiece Animation Overlay */}
      <ActionCardOverlay
        lastActionMessage={lastActionMessage}
        lastActionType={tableState.lastActionType}
        activeColor={activeColor}
        currentSide={currentSide}
      />

      {/* Top Modern HUD Bar */}
      <header className="relative z-20 w-full px-2.5 sm:px-4 py-1.5 sm:py-2 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <span className="font-heading font-black text-amber-400 text-xs sm:text-sm tracking-wide">
            ROUND {roundNumber}
          </span>
          <span className="text-slate-600 hidden xs:inline">·</span>

          {/* Mode / Side Indicator */}
          {rules.deckEdition === 'flip' ? (
            <span
              className={`px-2 sm:px-2.5 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 transition-all ${
                currentSide === 'dark'
                  ? 'bg-purple-950/90 text-pink-300 border-pink-400 ring-1 ring-pink-500/40 shadow-md shadow-purple-950/60 animate-pulse'
                  : 'bg-slate-900 text-amber-300 border-white/60 shadow-xs'
              }`}
            >
              {currentSide === 'dark' ? <Moon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400" /> : <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />}
              <span>{currentSide === 'dark' ? 'DARK SIDE 🌌' : 'LIGHT SIDE ☀️'}</span>
            </span>
          ) : rules.deckEdition === 'no_mercy' ? (
            <span className="px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-red-950/90 text-red-300 border-red-500 flex items-center gap-1">
              <Skull className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
              <span>NO MERCY</span>
            </span>
          ) : (
            <span className="text-slate-400 hidden sm:inline font-medium">
              FIRST TO {rules.targetScore} PTS
            </span>
          )}
        </div>

        {/* Central Turn Status Pill */}
        <div
          className={`px-2.5 sm:px-4 py-1 rounded-full border text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-2 transition-all ${
            isMyTurn
              ? currentSide === 'dark'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-300 shadow-md shadow-pink-950/60 ring-2 ring-pink-400/50 animate-pulse'
                : 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-950/60 ring-2 ring-amber-400/50 animate-pulse'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80'
          }`}
        >
          {isMyTurn ? <Bell className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-current animate-bounce" /> : null}
          <span>{isMyTurn ? '★ YOUR TURN' : `${currentPlayer?.name.toUpperCase()}'S TURN`}</span>
        </div>

        {/* Utility Audio, Voice & Rules Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Voice Effects Toggle */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
              !voiceMuted
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
            }`}
            title={voiceMuted ? 'Voice Announcements: OFF (Tap to Enable)' : 'Voice Announcements: ON'}
          >
            {!voiceMuted ? <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Background Music Toggle */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onToggleMusic();
            }}
            className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer ${
              !musicMuted
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
            }`}
            title="Toggle Background Music"
          >
            <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleSfx();
              if (sfxMuted) soundFx.playClick();
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Sound Effects"
          >
            {sfxMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>

          {/* Rules */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenRules();
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Rules & Mods"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Supabase Settings */}
          {onOpenSupabaseSettings && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenSupabaseSettings();
              }}
              className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 transition-colors cursor-pointer"
              title="Realtime Engine"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            </button>
          )}

          {/* Leave Game */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Leave current card game?')) {
                soundFx.playClick();
                onLeaveGame();
              }
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            title="Leave Match"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Up to 7 Opponents Perimeter Layout (Horizontal scroll on mobile, flex-wrap on desktop) */}
      <div className="relative z-10 w-full px-2 sm:px-3 pt-1.5 pb-1 flex items-center justify-start sm:justify-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar sm:flex-wrap max-w-6xl mx-auto">
        {opponents.map((opp) => {
          const isOppTurn = currentPlayer?.id === opp.id;
          const hasOne = opp.handCount === 1;

          return (
            <div
              key={opp.id}
              className={`p-1.5 sm:p-2 rounded-xl border shrink-0 transition-all flex items-center gap-2 ${
                opp.isEliminated
                  ? 'bg-red-950/40 border-red-800/60 opacity-60'
                  : isOppTurn
                  ? currentSide === 'dark'
                    ? 'bg-purple-950/90 border-pink-400 shadow-md shadow-pink-950/60 ring-2 ring-pink-400/40 scale-102'
                    : 'bg-slate-900/95 border-amber-400 shadow-md shadow-amber-950/40 ring-2 ring-amber-400/40 scale-102'
                  : 'bg-slate-950/80 border-slate-800/80 backdrop-blur-xs'
              }`}
            >
              <ModernAvatar
                avatar={opp.avatar}
                size="sm"
                isCurrentTurn={isOppTurn}
                hasOneCard={hasOne}
              />
              <div className="text-left">
                <div className="font-semibold text-[11px] sm:text-xs text-white truncate max-w-[76px] sm:max-w-[120px] flex items-center gap-1">
                  <span>{opp.name}</span>
                  {opp.isEliminated && <Skull className="w-3 h-3 text-red-400 shrink-0" />}
                </div>

                <div className="text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className={`font-bold ${opp.isEliminated ? 'text-red-400' : hasOne ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                    {opp.isEliminated ? 'KNOCKED OUT' : `${opp.handCount} ${opp.handCount === 1 ? 'CARD!' : 'Cards'}`}
                  </span>
                  <span>·</span>
                  <span>{opp.score} pts</span>
                </div>

                {/* Opponents' Reverse Side Spy Preview (UNO Flip feature) */}
                {rules.deckEdition === 'flip' && !opp.isEliminated && opp.hand && opp.hand.length > 0 && (
                  <div className="flex items-center -space-x-3 overflow-hidden max-w-[80px] sm:max-w-[110px] mt-1 pt-0.5 border-t border-white/10" title="Opponent's Reverse Cards (visible to you!)">
                    {opp.hand.slice(0, 4).map((c, i) => (
                      <div key={c.id || i} className="shrink-0 hover:z-20 transition-transform">
                        <ModernCard card={c} size="xs" side={currentSide} showReverse={true} />
                      </div>
                    ))}
                    {opp.hand.length > 4 && (
                      <span className="text-[7px] font-bold text-amber-300 bg-black/80 border border-slate-700 px-1 rounded-full z-10 shrink-0">
                        +{opp.hand.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Modern Casino Felt Game Table Mat */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-4xl mx-auto px-2 sm:px-4 flex flex-col items-center justify-center my-0.5 sm:my-1 overflow-hidden">
        {/* Prominent Floating Player Turn Banner */}
        {isMyTurn && (
          <div className={`w-full max-w-md mx-auto mb-1 px-3 py-1 rounded-full ${
            currentSide === 'dark'
              ? 'bg-gradient-to-r from-pink-500/20 via-purple-600/30 to-pink-500/20 border border-pink-400 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
              : 'bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
          } font-heading font-black text-[10px] sm:text-xs flex items-center justify-center gap-1.5 animate-bounce tracking-wide select-none shrink-0`}>
            <Sparkles className="w-3 h-3 text-current animate-spin" />
            <span>IT'S YOUR TURN! TAP A CARD OR DRAW DECK</span>
            <Sparkles className="w-3 h-3 text-current animate-spin" />
          </div>
        )}

        {/* Luxury Felt Table Container */}
        <div
          className={`relative w-full max-w-xl py-2 sm:py-4 px-2.5 sm:px-5 ${
            currentSide === 'dark'
              ? 'bg-gradient-to-b from-purple-950/70 via-slate-950 to-black border-2 border-purple-500/80 shadow-[0_0_30px_rgba(168,85,247,0.35)]'
              : `felt-table border-2 ${currentTheme.ring}`
          } rounded-2xl sm:rounded-3xl card-shadow flex flex-col items-center justify-between gap-1.5 sm:gap-3 transition-all duration-500 my-auto`}
        >
          {/* Top Info Bar inside Table: Direction & Active Color Beacon */}
          <div className="relative z-10 w-full flex items-center justify-between px-2 text-[10px] sm:text-xs font-semibold">
            {/* Play Direction */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-slate-300">
              {direction === 1 ? (
                <>
                  <RotateCw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Clockwise</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Counter-Clockwise</span>
                </>
              )}
            </div>

            {/* Active Color Beacon */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-white shadow-md ${currentTheme.bg}`}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
              <span className="uppercase tracking-wider">Active: {activeColor}</span>
            </div>
          </div>

          {/* Center Arena: Draw Pile & Discard Pile */}
          <div className="relative z-10 flex items-center justify-center gap-5 sm:gap-12 my-0.5 sm:my-1">
            {/* Draw Pile (Deck) */}
            <div className="flex flex-col items-center gap-1">
              <div
                onClick={() => {
                  if (isMyTurn) {
                    onDrawCard();
                  } else {
                    soundFx.playError();
                  }
                }}
                className={`relative group cursor-pointer transition-transform ${
                  isMyTurn ? 'hover:scale-105 active:scale-95 ring-3 ring-sky-400 rounded-xl sm:rounded-2xl' : 'opacity-85 cursor-not-allowed'
                }`}
                title={isMyTurn ? 'Tap to draw a card' : "Wait for your turn"}
              >
                <ModernCard isBack size="md" side={currentSide} />
                <span className="absolute -top-1.5 -right-1.5 bg-slate-950 border border-slate-700 text-amber-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow">
                  {drawPileCount}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-300 flex items-center gap-1">
                {isMyTurn ? <span className="text-sky-300 font-bold">Tap to Draw</span> : 'Draw Deck'}
              </span>
            </div>

            {/* Center Discard Pile */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative">
                <ModernCard card={topDiscard} size="md" side={currentSide} isPlayable={false} />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-slate-300">Discard Pile</span>
            </div>
          </div>

          {/* Stacking Penalty Alert Banner */}
          {pendingDrawPenalty > 0 && (
            <div className="relative z-10 px-3 py-1 rounded-lg sm:rounded-xl bg-rose-950/90 border border-rose-500 font-bold text-[10px] sm:text-xs text-rose-200 flex items-center gap-1.5 animate-bounce shadow-md">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 fill-current" />
              <span>
                Stacking Active! Penalty pool is +{pendingDrawPenalty} cards.
              </span>
            </div>
          )}

          {/* Action Log Ticker */}
          <div className="relative z-10 w-full max-w-sm bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-center text-[10px] sm:text-xs font-medium text-amber-300 truncate shadow-inner">
            {lastActionMessage}
          </div>
        </div>
      </main>

      {/* Bottom Area: Controls & Player Hand */}
      <footer
        className={`relative z-20 w-full shrink-0 backdrop-blur-md border-t px-2 py-1.5 sm:py-2.5 pb-safe flex flex-col gap-1 sm:gap-2 transition-all duration-300 ${
          isMyTurn
            ? currentSide === 'dark'
              ? 'bg-black/98 border-pink-500/80 shadow-[0_-8px_30px_rgba(236,72,153,0.25)] ring-1 ring-pink-500/40'
              : 'bg-slate-950/98 border-amber-400/90 shadow-[0_-8px_30px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/40'
            : 'bg-slate-950/95 border-slate-800'
        }`}
      >
        {/* Action Controls Toolbar */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-1 gap-1.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Player Identity Info */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ModernAvatar avatar={localPlayer.avatar} size="sm" isCurrentTurn={isMyTurn} />
            <div className="leading-tight">
              <div className="font-semibold text-xs sm:text-sm text-white flex items-center gap-1 sm:gap-1.5">
                <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">{localPlayer.name}</span>
                <span className="text-[8px] sm:text-[9px] font-bold bg-sky-600/30 text-sky-300 border border-sky-500/40 px-1 py-0.2 rounded-full uppercase">
                  YOU
                </span>
                {isMyTurn && (
                  <span className={`text-[8px] sm:text-[9px] font-extrabold ${currentSide === 'dark' ? 'bg-pink-500 text-white' : 'bg-amber-400 text-slate-950'} px-1.5 py-0.2 rounded-full uppercase animate-pulse`}>
                    TURN
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">
                <strong className={localPlayer.hand.length === 1 ? 'text-rose-400 font-extrabold' : 'text-slate-200'}>
                  {localPlayer.hand.length} {localPlayer.hand.length === 1 ? 'CARD LEFT!' : 'Cards'}
                </strong>{' '}
                · {localPlayer.score} pts
              </div>
            </div>
          </div>

          {/* Action Buttons: Peek Reverse, CALL UNO, CATCH UNO, DRAW */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Peek Reverse Side Button (UNO Flip feature) */}
            {rules.deckEdition === 'flip' && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setPeekReverse(!peekReverse);
                }}
                className={`py-1 sm:py-1.5 px-2 sm:px-2.5 rounded-lg sm:rounded-xl font-heading font-bold text-[10px] sm:text-xs border transition-all flex items-center gap-1 cursor-pointer shadow-xs shrink-0 min-h-[34px] sm:min-h-[38px] ${
                  peekReverse
                    ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/50'
                    : 'bg-slate-900/90 text-amber-300 border-amber-400/40 hover:bg-slate-800'
                }`}
                title="Preview what cards you'll have if the game flips"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden xs:inline">{peekReverse ? 'FRONT' : 'PEEK REVERSE'}</span>
                <span className="xs:hidden">{peekReverse ? 'FRONT' : 'PEEK'}</span>
              </button>
            )}

            {/* Catch UNO button when opponent forgot */}
            {caughtTargetPlayer && (
              <button
                type="button"
                onClick={() => {
                  soundFx.speakCaught(caughtTargetPlayer.name);
                  onCatchUno(caughtTargetPlayer.id);
                }}
                className="py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] sm:text-xs shadow-md shadow-rose-950 animate-pulse flex items-center gap-1 cursor-pointer shrink-0 min-h-[34px] sm:min-h-[38px]"
                title="Catch opponent who didn't call UNO!"
              >
                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>CATCH!</span>
              </button>
            )}

            {/* CALL UNO Button - Specially enabled ONLY when 1 card left */}
            {localPlayer.hand.length === 1 ? (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  soundFx.speakUno(localPlayer.name);
                  onCallUno();
                }}
                className={`py-1 sm:py-1.5 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl font-heading font-black text-[11px] sm:text-xs transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-lg shrink-0 min-h-[34px] sm:min-h-[38px] ${
                  localPlayer.hasCalledUno
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60'
                    : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white animate-bounce shadow-red-950/80 ring-3 ring-yellow-400 scale-102'
                }`}
                title="Press to call UNO!"
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current animate-spin" />
                <span>{localPlayer.hasCalledUno ? '✓ UNO CALLED!' : '🚨 CALL UNO!'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="hidden md:flex py-1 sm:py-1.5 px-2.5 rounded-lg font-heading font-semibold text-[10px] bg-slate-900/60 text-slate-600 border border-slate-800/80 items-center gap-1 cursor-not-allowed opacity-50 shrink-0"
                title="CALL UNO unlocks when only 1 card remains"
              >
                <span>CALL UNO (1 CARD LEFT)</span>
              </button>
            )}

            {/* Quick Draw Button */}
            {isMyTurn && (
              <button
                type="button"
                onClick={() => {
                  onDrawCard();
                }}
                className="py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-[10px] sm:text-xs shadow-md shadow-sky-950/50 cursor-pointer shrink-0 min-h-[34px] sm:min-h-[38px]"
              >
                DRAW
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Player Hand with Snug Overlap on Phones */}
        <div className="w-full max-w-5xl mx-auto overflow-x-auto pb-1 pt-0.5 flex items-end justify-start sm:justify-center -space-x-4 sm:-space-x-2 md:space-x-1 px-3 sm:px-6 scrollbar-thin">
          {localPlayer.hand.map((card) => {
            const playable =
              isMyTurn &&
              isCardPlayable(
                card,
                activeColor,
                topDiscard,
                pendingDrawPenalty,
                rules.stacking,
                currentSide,
                localPlayer.hand
              );

            return (
              <div
                key={card.id}
                className={`shrink-0 transition-all duration-150 hover:z-30 hover:-translate-y-3 sm:hover:-translate-y-4 hover:scale-105 active:scale-95 ${
                  playable ? '-translate-y-1 sm:-translate-y-1.5 z-10' : ''
                }`}
              >
                <ModernCard
                  card={card}
                  size="lg"
                  side={currentSide}
                  showReverse={peekReverse}
                  isPlayable={playable}
                  onClick={() => handleCardClick(card)}
                />
              </div>
            );
          })}

          {localPlayer.hand.length === 0 && (
            <div className="font-heading font-bold text-xs sm:text-sm text-amber-400 py-4 animate-pulse">
              No cards left! Round won!
            </div>
          )}
        </div>
      </footer>

      {/* Modals */}
      {selectedWildCard && (
        <WildColorPicker
          onSelectColor={handleWildColorSelected}
          isDrawFour={selectedWildCard.type === 'wild4' || selectedWildCard.type === 'draw10'}
          side={currentSide}
        />
      )}

      {tableState.phase === 'ROUND_END' && (
        <RoundEndModal
          tableState={tableState}
          onNextRound={onNextRound}
          onRestartMatch={onRestartMatch}
          isHost={isHost}
        />
      )}
    </div>
  );
};
