import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCw,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  BookOpen,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  Zap,
  LogOut,
  Mic,
  MicOff,
  Bell,
  Flame,
} from 'lucide-react';
import { Card, CardColor, GameTableState, Player } from '../../types/game';
import { ModernCard } from '../modern/ModernCard';
import { ModernAvatar } from '../modern/ModernAvatar';
import { PixelParticles } from '../pixel/PixelParticles';
import { WildColorPicker } from './WildColorPicker';
import { RoundEndModal } from './RoundEndModal';
import { ActionCardOverlay } from '../common/ActionCardOverlay';
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
    }
  }, [tableState.lastActionMessage, tableState.lastActionType, tableState.pendingDrawPenalty, tableState.activeColor]);

  // Particle feedback on move changes
  useEffect(() => {
    if (tableState.lastActionType === 'wild') {
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
      rules.stacking
    );
    if (!playable) {
      soundFx.playError();
      return;
    }

    // If Wild or Wild 4, prompt for color selection
    if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
      setSelectedWildCard(card);
      soundFx.playClick();
      return;
    }

    // Normal play (no pre-call; call UNO is triggered when 1 card remains)
    onPlayCard(card.id, undefined, false);
  };

  const handleWildColorSelected = (chosenColor: Exclude<CardColor, 'wild'>) => {
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
  };

  // Check if someone can be caught forgetting UNO
  const caughtTargetPlayer = unoCallPendingPlayerId
    ? players.find((p) => p.id === unoCallPendingPlayerId && p.id !== localPlayer.id)
    : null;

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Visual Particle Overlay */}
      <PixelParticles triggerKey={particleTrigger} type={particleType} />

      {/* Action Card Dramatic Centerpiece Animation Overlay */}
      <ActionCardOverlay
        lastActionMessage={lastActionMessage}
        lastActionType={tableState.lastActionType}
        activeColor={activeColor}
      />

      {/* Top Modern HUD Bar */}
      <header className="relative z-20 w-full px-4 py-2.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-amber-400 text-sm tracking-wide">
            ROUND {roundNumber}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 hidden sm:inline font-medium">
            FIRST TO {rules.targetScore} PTS
          </span>
        </div>

        {/* Central Turn Status Pill */}
        <div
          className={`px-4 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 transition-all ${
            isMyTurn
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-950/60 ring-2 ring-amber-400/50 scale-105 animate-pulse'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80'
          }`}
        >
          {isMyTurn ? <Bell className="w-3.5 h-3.5 text-slate-950 animate-bounce" /> : null}
          <span>{isMyTurn ? '★ YOUR TURN' : `${currentPlayer?.name.toUpperCase()}'S TURN`}</span>
        </div>

        {/* Utility Audio, Voice & Rules Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Voice Effects Toggle */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              !voiceMuted
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
            }`}
            title={voiceMuted ? 'Voice Announcements: OFF (Tap to Enable)' : 'Voice Announcements: ON'}
          >
            {!voiceMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Background Music Toggle */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onToggleMusic();
            }}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              !musicMuted
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'
            }`}
            title="Toggle Background Music [M]"
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleSfx();
              if (sfxMuted) soundFx.playClick();
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title="Toggle Sound Effects"
          >
            {sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Rules */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenRules();
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Game Rules"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Supabase Realtime Engine */}
          {onOpenSupabaseSettings && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenSupabaseSettings();
              }}
              className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              title="Realtime Engine Status & Config"
            >
              <Zap className="w-4 h-4 fill-current" />
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
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/50 transition-colors cursor-pointer"
            title="Leave Match"
          >
            <LogOut className="w-4 h-4" />
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
                isOppTurn
                  ? 'bg-slate-900/95 border-amber-400 shadow-md shadow-amber-950/40 ring-2 ring-amber-400/40 scale-102'
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
                <div className="font-semibold text-[11px] sm:text-xs text-white truncate max-w-[76px] sm:max-w-[120px]">
                  {opp.name}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className={`font-bold ${hasOne ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                    {opp.handCount} {opp.handCount === 1 ? 'CARD!' : 'Cards'}
                  </span>
                  <span>·</span>
                  <span>{opp.score} pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Modern Casino Felt Game Table Mat */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 flex flex-col items-center justify-center my-0.5 sm:my-2">
        {/* Prominent Floating Player Turn Banner */}
        {isMyTurn && (
          <div className="w-full max-w-xl mx-auto mb-1.5 sm:mb-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 border-2 border-amber-400 text-amber-200 font-heading font-black text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_0_25px_rgba(251,191,36,0.4)] animate-bounce tracking-wide select-none">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-spin" />
            <span>IT'S YOUR TURN! TAP A CARD OR DRAW DECK</span>
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 animate-spin" />
          </div>
        )}

        {/* Luxury Felt Table Container */}
        <div
          className={`relative w-full max-w-2xl py-3.5 sm:py-7 px-3 sm:px-6 felt-table border-2 ${
            activeColorTheme[activeColor].ring
          } rounded-2xl sm:rounded-3xl card-shadow flex flex-col items-center justify-between gap-3 sm:gap-6 transition-colors duration-300`}
        >
          {/* Top Info Bar inside Table: Direction & Active Color Beacon */}
          <div className="relative z-10 w-full flex items-center justify-between px-3 text-xs font-semibold">
            {/* Play Direction */}
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-slate-300">
              {direction === 1 ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Clockwise</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Counter-Clockwise</span>
                </>
              )}
            </div>

            {/* Active Color Beacon */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-white shadow-md ${activeColorTheme[activeColor].bg}`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
              <span className="uppercase tracking-wider">Active: {activeColor}</span>
            </div>
          </div>

          {/* Center Arena: Draw Pile & Discard Pile */}
          <div className="relative z-10 flex items-center justify-center gap-8 sm:gap-14 my-1">
            {/* Draw Pile (Deck) */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => {
                  if (isMyTurn) {
                    onDrawCard();
                  } else {
                    soundFx.playError();
                  }
                }}
                className={`relative group cursor-pointer transition-transform ${
                  isMyTurn ? 'hover:scale-105 active:scale-95 ring-3 ring-sky-400 rounded-2xl' : 'opacity-85 cursor-not-allowed'
                }`}
                title={isMyTurn ? 'Tap to draw a card' : "Wait for your turn"}
              >
                <ModernCard isBack size="md" />
                <span className="absolute -top-2 -right-2 bg-slate-950 border border-slate-700 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  {drawPileCount}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                {isMyTurn ? <span className="text-sky-300 font-bold">Tap to Draw</span> : 'Draw Deck'}
              </span>
            </div>

            {/* Center Discard Pile */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <ModernCard card={topDiscard} size="md" isPlayable={false} />
              </div>
              <span className="text-xs font-medium text-slate-300">Discard Pile</span>
            </div>
          </div>

          {/* Stacking Penalty Alert Banner */}
          {pendingDrawPenalty > 0 && (
            <div className="relative z-10 px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500 font-bold text-xs text-rose-200 flex items-center gap-2 animate-bounce shadow-lg">
              <AlertTriangle className="w-4 h-4 text-rose-400 fill-current" />
              <span>
                Stacking Active! Penalty pool is +{pendingDrawPenalty} cards.
              </span>
            </div>
          )}

          {/* Action Log Ticker */}
          <div className="relative z-10 w-full max-w-md bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-center text-xs font-medium text-amber-300 truncate shadow-inner">
            {lastActionMessage}
          </div>
        </div>
      </main>

      {/* Bottom Area: Controls & Player Hand */}
      <footer
        className={`relative z-20 w-full backdrop-blur-md border-t p-3 sm:p-5 flex flex-col gap-3 transition-all duration-300 ${
          isMyTurn
            ? 'bg-slate-950/98 border-amber-400/90 shadow-[0_-12px_45px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/40'
            : 'bg-slate-950/95 border-slate-800'
        }`}
      >
        {/* Action Controls Toolbar */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-2 gap-3">
          {/* Player Identity Info */}
          <div className="flex items-center gap-3">
            <ModernAvatar avatar={localPlayer.avatar} size="sm" isCurrentTurn={isMyTurn} />
            <div>
              <div className="font-semibold text-sm text-white flex items-center gap-2">
                <span>{localPlayer.name}</span>
                <span className="text-[10px] font-bold bg-sky-600/30 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full uppercase">
                  YOU
                </span>
                {isMyTurn && (
                  <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase animate-pulse">
                    YOUR TURN
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                <strong className={localPlayer.hand.length === 1 ? 'text-rose-400 font-extrabold text-sm' : 'text-slate-200'}>
                  {localPlayer.hand.length} {localPlayer.hand.length === 1 ? 'CARD LEFT!' : 'Cards'}
                </strong>{' '}
                · {localPlayer.score} pts
              </div>
            </div>
          </div>

          {/* Action Buttons: CALL UNO, CATCH UNO, DRAW */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Catch UNO button when opponent forgot */}
            {caughtTargetPlayer && (
              <button
                type="button"
                onClick={() => {
                  soundFx.speakCaught(caughtTargetPlayer.name);
                  onCatchUno(caughtTargetPlayer.id);
                }}
                className="py-1.5 sm:py-2 px-2.5 sm:px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950 animate-pulse flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Catch opponent who didn't call UNO!"
              >
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>CATCH {caughtTargetPlayer.name.toUpperCase()}!</span>
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
                className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl font-heading font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-xl shrink-0 ${
                  localPlayer.hasCalledUno
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60'
                    : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white animate-bounce shadow-red-950/80 ring-4 ring-yellow-400/80 scale-105'
                }`}
                title="Press to call UNO!"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current animate-spin" />
                <span>{localPlayer.hasCalledUno ? '✓ UNO CALLED!' : '🚨 CALL UNO! (1 CARD) 🚨'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="hidden md:flex py-1.5 sm:py-2 px-3 rounded-xl font-heading font-semibold text-xs bg-slate-900/60 text-slate-600 border border-slate-800/80 items-center gap-1.5 cursor-not-allowed opacity-50 shrink-0"
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
                className="py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-950/50 cursor-pointer shrink-0"
              >
                DRAW CARD
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Player Hand */}
        <div className="w-full max-w-5xl mx-auto overflow-x-auto pb-2 pt-1 flex items-end justify-start sm:justify-center -space-x-1 sm:space-x-2 px-2 sm:px-4 scrollbar-thin">
          {localPlayer.hand.map((card) => {
            const playable =
              isMyTurn &&
              isCardPlayable(
                card,
                activeColor,
                topDiscard,
                pendingDrawPenalty,
                rules.stacking
              );

            return (
              <div
                key={card.id}
                className="shrink-0 transition-transform duration-150 hover:z-30 hover:-translate-y-3 sm:hover:-translate-y-4"
              >
                <ModernCard
                  card={card}
                  size="lg"
                  isPlayable={playable}
                  onClick={() => handleCardClick(card)}
                />
              </div>
            );
          })}

          {localPlayer.hand.length === 0 && (
            <div className="font-heading font-bold text-sm text-amber-400 py-6 animate-pulse">
              No cards left! Round won!
            </div>
          )}
        </div>
      </footer>

      {/* Modals */}
      {selectedWildCard && (
        <WildColorPicker
          onSelectColor={handleWildColorSelected}
          isDrawFour={selectedWildCard.type === 'wild4'}
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
