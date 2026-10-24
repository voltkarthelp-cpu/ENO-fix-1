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
  Clock,
} from 'lucide-react';
import { Card, CardColor, GameTableState } from '../../types/game';
import { ModernCard } from '../modern/ModernCard';
import { ModernAvatar } from '../modern/ModernAvatar';
import { WildColorPicker } from './WildColorPicker';
import { RoundEndModal } from './RoundEndModal';
import { ActionCardOverlay } from '../common/ActionCardOverlay';
import { PixelParticles } from '../pixel/PixelParticles';
import { isCardPlayable, getSeatedPlayersAroundTable } from '../../game/cardEngine';
import { soundFx } from '../../sound/soundFx';

const getSeatPositionClass = (seatIndex: number, totalPlayers: number): string => {
  // seatIndex 0 is Local Player (rendered in bottom hand toolbar).
  // seatIndex 1..totalPlayers-1 are opponents positioned clockwise along the wooden rim of the poker table.
  if (totalPlayers === 2) {
    return 'top-[2%] sm:top-[4%] left-1/2 -translate-x-1/2';
  }

  if (totalPlayers === 3) {
    if (seatIndex === 1) return 'top-[5%] sm:top-[7%] right-[8%] sm:right-[16%]';
    return 'top-[5%] sm:top-[7%] left-[8%] sm:left-[16%]';
  }

  if (totalPlayers === 4) {
    if (seatIndex === 1) return 'top-1/2 left-[1%] sm:left-[3%] -translate-y-1/2';
    if (seatIndex === 2) return 'top-[2%] sm:top-[4%] left-1/2 -translate-x-1/2';
    return 'top-1/2 right-[1%] sm:right-[3%] -translate-y-1/2';
  }

  if (totalPlayers === 5) {
    if (seatIndex === 1) return 'bottom-[10%] sm:bottom-[15%] left-[1%] sm:left-[3%]';
    if (seatIndex === 2) return 'top-[3%] sm:top-[5%] left-[12%] sm:left-[18%]';
    if (seatIndex === 3) return 'top-[3%] sm:top-[5%] right-[12%] sm:right-[18%]';
    return 'bottom-[10%] sm:bottom-[15%] right-[1%] sm:right-[3%]';
  }

  if (totalPlayers === 6) {
    if (seatIndex === 1) return 'bottom-[10%] sm:bottom-[15%] left-[1%] sm:left-[3%]';
    if (seatIndex === 2) return 'top-[4%] sm:top-[6%] left-[10%] sm:left-[15%]';
    if (seatIndex === 3) return 'top-[1%] sm:top-[3%] left-1/2 -translate-x-1/2';
    if (seatIndex === 4) return 'top-[4%] sm:top-[6%] right-[10%] sm:right-[15%]';
    return 'bottom-[10%] sm:bottom-[15%] right-[1%] sm:right-[3%]';
  }

  if (totalPlayers === 7) {
    if (seatIndex === 1) return 'bottom-[9%] sm:bottom-[13%] left-[1%]';
    if (seatIndex === 2) return 'top-[40%] left-[0.5%] sm:left-[1.5%] -translate-y-1/2';
    if (seatIndex === 3) return 'top-[2%] sm:top-[4%] left-[14%] sm:left-[20%]';
    if (seatIndex === 4) return 'top-[2%] sm:top-[4%] right-[14%] sm:right-[20%]';
    if (seatIndex === 5) return 'top-[40%] right-[0.5%] sm:right-[1.5%] -translate-y-1/2';
    return 'bottom-[9%] sm:bottom-[13%] right-[1%]';
  }

  // 8 players
  if (seatIndex === 1) return 'bottom-[9%] sm:bottom-[13%] left-[1%]';
  if (seatIndex === 2) return 'top-[40%] left-[0.5%] sm:left-[1.5%] -translate-y-1/2';
  if (seatIndex === 3) return 'top-[2%] sm:top-[4%] left-[12%] sm:left-[16%]';
  if (seatIndex === 4) return 'top-[0.5%] sm:top-[2%] left-1/2 -translate-x-1/2';
  if (seatIndex === 5) return 'top-[2%] sm:top-[4%] right-[12%] sm:right-[16%]';
  if (seatIndex === 6) return 'top-[40%] right-[0.5%] sm:right-[1.5%] -translate-y-1/2';
  return 'bottom-[9%] sm:bottom-[13%] right-[1%]';
};

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

  // 20s Live Turn Timer Clock
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const turnElapsedMs = Math.max(0, now - (tableState.turnStartTime || now));
  const secondsRemaining = Math.max(0, Math.ceil((20000 - turnElapsedMs) / 1000));

  // Arrange players in strict round order around the poker table starting with local player
  const seatedPlayers = getSeatedPlayersAroundTable(players, localPlayerId, currentPlayerIndex);
  const seatedOpponents = seatedPlayers.filter((s) => !s.isLocalPlayer);

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

      {/* Poker Table Arena with 2-8 Seated Opponents Layout */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-5xl mx-auto px-1 sm:px-3 flex flex-col items-center justify-center overflow-hidden my-auto select-none">
        <div className="relative w-full aspect-[2/1] max-h-[360px] xs:max-h-[400px] sm:max-h-[460px] md:max-h-[520px] flex items-center justify-center">
          {/* Uploaded Photorealistic Green Felt Poker Table Image blended as playground */}
          <img
            src="/assets/aistudio/Photorealistic_Green_Felt_Poker_Table_580daa35.png"
            alt="Photorealistic Felt Poker Table"
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none transition-all duration-500 ${
              currentSide === 'dark'
                ? 'filter hue-rotate-180 brightness-75 contrast-125'
                : 'brightness-100'
            }`}
          />

          {/* Opponents seated in round order (Clockwise) along the table wooden rim */}
          {seatedOpponents.map((s) => {
            const opp = s.player;
            const isOppTurn = s.isCurrentTurn;
            const hasOne = opp.handCount === 1;
            const positionClass = getSeatPositionClass(s.seatIndex, players.length);

            return (
              <div
                key={opp.id}
                className={`absolute ${positionClass} z-20 flex items-center gap-1.5 p-1 sm:p-2 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-200 max-w-[110px] xs:max-w-[130px] sm:max-w-[160px] select-none ${
                  opp.isEliminated
                    ? 'bg-red-950/80 border-red-800 text-red-300 opacity-60'
                    : isOppTurn
                    ? currentSide === 'dark'
                      ? 'bg-purple-950/95 border-pink-400 ring-2 ring-pink-400/80 shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-105 z-30'
                      : 'bg-slate-950/95 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.4)] scale-105 z-30'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Avatar with Status Glow */}
                <div className="relative shrink-0">
                  <ModernAvatar
                    avatar={opp.avatar}
                    size="sm"
                    isCurrentTurn={isOppTurn}
                    hasOneCard={hasOne}
                  />
                  {opp.isEliminated && (
                    <div className="absolute inset-0 bg-red-950/80 rounded-full flex items-center justify-center">
                      <Skull className="w-3.5 h-3.5 text-red-400" />
                    </div>
                  )}
                </div>

                {/* Profile Details: Name, Score, Cards Component, Seconds Component */}
                <div className="text-left min-w-0 flex-1 leading-tight flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[10px] sm:text-xs text-white truncate">
                      {opp.name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 shrink-0">
                      {opp.score}p
                    </span>
                  </div>

                  {/* Dedicated Cards Component and Seconds Component */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Cards Component */}
                    <div
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-bold border ${
                        opp.isEliminated
                          ? 'bg-red-900/40 border-red-800 text-red-300'
                          : hasOne
                          ? 'bg-rose-500/25 border-rose-500/70 text-rose-300 animate-pulse ring-1 ring-rose-500/50'
                          : 'bg-slate-900 border-slate-700/80 text-amber-300'
                      }`}
                      title={`${opp.handCount} cards in hand`}
                    >
                      <span className="text-[10px] leading-none">🂠</span>
                      <span>{opp.isEliminated ? 'KO' : `${opp.handCount} ${hasOne ? 'UNO!' : ''}`}</span>
                    </div>

                    {/* Seconds Component for active opponent */}
                    {isOppTurn && !opp.isEliminated && (
                      <div
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-mono text-[9px] sm:text-[10px] font-black border transition-all ${
                          secondsRemaining <= 5
                            ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse'
                            : 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                        }`}
                        title={`${secondsRemaining}s left before AFK skip`}
                      >
                        <Clock className="w-2.5 h-2.5 animate-spin text-current" style={{ animationDuration: '4s' }} />
                        <span>{secondsRemaining}s</span>
                      </div>
                    )}
                  </div>

                  {/* 20s Mini Progress Bar for active opponent */}
                  {isOppTurn && !opp.isEliminated && (
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5 border border-slate-700/40">
                      <div
                        className={`h-full transition-all duration-200 ${
                          secondsRemaining <= 5 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                        }`}
                        style={{ width: `${Math.min(100, (secondsRemaining / 20) * 100)}%` }}
                      />
                    </div>
                  )}

                  {/* UNO Flip: Opponent Reverse Side Spy Preview */}
                  {rules.deckEdition === 'flip' && !opp.isEliminated && opp.hand && opp.hand.length > 0 && (
                    <div
                      className="flex items-center -space-x-2.5 overflow-hidden max-w-[65px] sm:max-w-[85px] mt-0.5 pt-0.5 border-t border-white/10"
                      title="Opponent's Reverse Cards"
                    >
                      {opp.hand.slice(0, 3).map((c, i) => (
                        <div key={c.id || i} className="shrink-0 hover:z-20 transition-transform">
                          <ModernCard card={c} size="xs" side={currentSide} showReverse={true} />
                        </div>
                      ))}
                      {opp.hand.length > 3 && (
                        <span className="text-[6px] font-bold text-amber-300 bg-black/80 border border-slate-700 px-0.5 rounded-full z-10 shrink-0">
                          +{opp.hand.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Center Felt Table Playground: Cards lying flat in 3D perspective on the green felt */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-1 sm:gap-2 max-w-xs sm:max-w-md w-full px-2">
            {/* Table Top Info: Play Direction & Active Color Beacon */}
            <div className="flex items-center justify-between w-full px-2 text-[10px] sm:text-xs font-semibold">
              {/* Direction */}
              <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-slate-300 shadow-md">
                {direction === 1 ? (
                  <>
                    <RotateCw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[9px] sm:text-xs">Clockwise</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[9px] sm:text-xs">Counter-CW</span>
                  </>
                )}
              </div>

              {/* Active Color Beacon */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-white shadow-md ${currentTheme.bg}`}>
                <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                <span className="uppercase tracking-wider text-[9px] sm:text-xs">Active: {activeColor}</span>
              </div>
            </div>

            {/* Flat Cards Playground on Green Felt */}
            <div className="poker-table-perspective flex items-center justify-center gap-6 sm:gap-12 my-1 sm:my-2">
              {/* Draw Pile: Stacked 3D deck lying flat on the green felt */}
              <div className="flex flex-col items-center gap-1">
                <div
                  onClick={() => {
                    if (isMyTurn) onDrawCard();
                    else soundFx.playError();
                  }}
                  className={`relative group cursor-pointer card-flat-deck select-none ${
                    isMyTurn ? 'ring-2 ring-sky-400 rounded-2xl shadow-sky-500/40' : 'opacity-90 cursor-not-allowed'
                  }`}
                  title={isMyTurn ? 'Tap to draw a card' : 'Wait for your turn'}
                >
                  {/* Felt Contact Shadow */}
                  <div className="absolute inset-0 translate-y-3.5 bg-black/75 rounded-2xl blur-md scale-95 pointer-events-none" />

                  {/* Stacked Deck Depth Layers */}
                  <div className="absolute inset-0 translate-x-[4px] translate-y-[5px] rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-700/60 shadow pointer-events-none" />
                  <div className="absolute inset-0 translate-x-[2px] translate-y-[2.5px] rounded-xl sm:rounded-2xl bg-slate-850 border border-slate-700/80 shadow pointer-events-none" />

                  {/* Top Card lying flat */}
                  <div className="relative z-10 felt-contact-shadow rounded-xl sm:rounded-2xl overflow-hidden">
                    <ModernCard isBack size="md" side={currentSide} />
                  </div>

                  {/* Remaining Cards Count Badge */}
                  <span className="absolute -top-2 -right-2 z-20 bg-slate-950/95 border border-amber-400/80 text-amber-300 text-[9px] sm:text-[11px] font-mono font-black px-1.5 py-0.5 rounded-full shadow-lg">
                    {drawPileCount}
                  </span>

                  {/* Turn Draw Hint Pill */}
                  {isMyTurn && (
                    <div className="absolute -bottom-2 inset-x-0 z-20 flex justify-center pointer-events-none">
                      <span className="bg-sky-500 text-white text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg shadow-sky-950/80 tracking-wider animate-bounce">
                        Tap Draw
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-300 drop-shadow mt-1">
                  Draw Pile
                </span>
              </div>

              {/* Discard Pile: Resting flat on the green felt with played angle */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative card-flat-discard select-none">
                  {/* Felt Contact Shadow */}
                  <div className="absolute inset-0 translate-y-3 bg-black/70 rounded-2xl blur-md scale-95 pointer-events-none" />

                  {/* Organic Underlay Card (previously played card on felt) */}
                  <div className="absolute inset-0 -rotate-8 -translate-x-1 translate-y-1 rounded-xl sm:rounded-2xl bg-slate-900/80 border border-white/20 shadow pointer-events-none opacity-60" />

                  {/* Top Discard Card lying flat */}
                  <div className={`relative z-10 felt-contact-shadow rounded-xl sm:rounded-2xl overflow-hidden ring-2 ${currentTheme.ring}`}>
                    <ModernCard card={topDiscard} size="md" side={currentSide} isPlayable={false} />
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold text-slate-300 drop-shadow mt-1">
                  Discard Pile
                </span>
              </div>
            </div>

            {/* Stacking Penalty Alert Banner */}
            {pendingDrawPenalty > 0 && (
              <div className="px-3 py-0.5 rounded-full bg-rose-950/90 border border-rose-500 font-bold text-[10px] sm:text-xs text-rose-200 flex items-center gap-1.5 animate-bounce shadow-md">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 fill-current" />
                <span>Stacking: +{pendingDrawPenalty} cards</span>
              </div>
            )}

            {/* Action Log Ticker */}
            <div className="w-full max-w-xs sm:max-w-sm bg-black/80 backdrop-blur-md border border-white/15 px-3 py-0.5 rounded-full text-center text-[9px] sm:text-[11px] font-medium text-amber-300 truncate shadow-inner">
              {lastActionMessage}
            </div>
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
          {/* Player Identity Info, Cards Component & Seconds Component */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative shrink-0">
              <ModernAvatar avatar={localPlayer.avatar} size="sm" isCurrentTurn={isMyTurn} />
              {isMyTurn && (
                <div
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                    secondsRemaining <= 5 ? 'bg-rose-500 animate-ping' : 'bg-amber-400 animate-pulse'
                  }`}
                />
              )}
            </div>

            <div className="flex flex-col gap-0.5 leading-tight">
              {/* Row 1: Name, YOU Badge, Score */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-heading font-black text-xs sm:text-sm text-white truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
                  {localPlayer.name}
                </span>
                <span className="text-[8px] sm:text-[9px] font-black bg-sky-500/25 text-sky-300 border border-sky-400/50 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  YOU
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-slate-400">
                  {localPlayer.score}p
                </span>
              </div>

              {/* Row 2: Dedicated Cards Component & Seconds Component */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* Cards Component */}
                <div
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono text-[10px] sm:text-xs font-bold transition-all ${
                    localPlayer.hand.length === 1
                      ? 'bg-rose-500/30 border-rose-500 text-rose-300 ring-2 ring-rose-500/60 animate-pulse'
                      : 'bg-slate-900/90 border-slate-700 text-amber-300'
                  }`}
                  title={`${localPlayer.hand.length} cards remaining`}
                >
                  <span className="text-xs">🂠</span>
                  <span>
                    {localPlayer.hand.length} {localPlayer.hand.length === 1 ? 'CARD LEFT!' : 'Cards'}
                  </span>
                </div>

                {/* Seconds Component */}
                {isMyTurn ? (
                  <div
                    className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg border font-mono text-[10px] sm:text-xs font-black transition-all ${
                      secondsRemaining <= 5
                        ? 'bg-rose-600 text-white border-rose-300 ring-2 ring-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.7)] animate-pulse'
                        : currentSide === 'dark'
                        ? 'bg-pink-500/30 border-pink-400 text-pink-300'
                        : 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                    }`}
                    title={`${secondsRemaining}s before auto-skip penalty`}
                  >
                    <Clock className="w-3 h-3 text-current animate-spin" style={{ animationDuration: '4s' }} />
                    <span>{secondsRemaining}s</span>
                  </div>
                ) : (
                  <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">
                    Waiting for {currentPlayer?.name}...
                  </span>
                )}
              </div>

              {/* Visual 20s Timer Progress Bar for active player */}
              {isMyTurn && (
                <div className="w-full max-w-[140px] sm:max-w-[180px] bg-slate-800/90 h-1 rounded-full overflow-hidden mt-0.5 border border-slate-700/60">
                  <div
                    className={`h-full transition-all duration-200 ${
                      secondsRemaining <= 5 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, (secondsRemaining / 20) * 100)}%` }}
                  />
                </div>
              )}
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
