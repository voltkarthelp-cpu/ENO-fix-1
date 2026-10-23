import React, { useState } from 'react';
import { ArrowLeft, Wifi, Check, Settings2, Users, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { AvatarId, GameDeckEdition, GameRules } from '../../types/game';
import { AVATAR_METADATA, ModernAvatar } from '../modern/ModernAvatar';
import { soundFx } from '../../sound/soundFx';

interface HostSetupScreenProps {
  onBack: () => void;
  onConfirmHost: (
    hostName: string,
    avatar: AvatarId,
    rules: GameRules,
    roomCode: string
  ) => void;
  defaultRoomCode: string;
}

const AVATAR_LIST: AvatarId[] = [
  'fox',
  'falcon',
  'tiger',
  'dragon',
  'bear',
  'wolf',
  'viper',
  'phoenix',
];

export const HostSetupScreen: React.FC<HostSetupScreenProps> = ({
  onBack,
  onConfirmHost,
  defaultRoomCode,
}) => {
  const [hostName, setHostName] = useState('Host Player');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>('dragon');
  const [deckEdition, setDeckEdition] = useState<GameDeckEdition>('flip');
  const [playerLimit, setPlayerLimit] = useState(8); // Maximum 8 players
  const [stacking, setStacking] = useState(true);
  const [startingHandSize, setStartingHandSize] = useState(7);
  const [targetScore, setTargetScore] = useState(250);
  const [drawUntilPlayable, setDrawUntilPlayable] = useState(false);
  const [unoPenaltyCards, setUnoPenaltyCards] = useState(2);
  const [mercyRule, setMercyRule] = useState(false);
  const [sevenZeroRule, setSevenZeroRule] = useState(false);

  const handleStart = () => {
    soundFx.playClick();
    onConfirmHost(
      hostName.trim() || 'Host',
      selectedAvatar,
      {
        deckEdition,
        playerLimit,
        startingHandSize,
        targetScore,
        stacking,
        drawUntilPlayable,
        unoPenaltyCards,
        turnTimeoutSeconds: 0,
        mercyRule: deckEdition === 'no_mercy' || mercyRule,
        sevenZeroRule,
      },
      defaultRoomCode
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-3 sm:p-8 flex flex-col items-center justify-between">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onBack();
          }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK</span>
        </button>

        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Host Wi-Fi Server
          </span>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="my-auto w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-heading font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-amber-400" />
            <span>Room Setup & Game Edition</span>
          </h2>
          <span className="text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-1 rounded-full tracking-wider">
            ROOM: #{defaultRoomCode}
          </span>
        </div>

        {/* Game Mode / Deck Edition Selector */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Select Card Game Edition</span>
            </label>
            <span className="text-[10px] font-bold text-pink-400 bg-pink-950/60 border border-pink-800 px-2.5 py-0.5 rounded-full uppercase">
              {deckEdition === 'flip' ? 'Double-Sided Deck' : deckEdition === 'no_mercy' ? 'Brutal Chaos' : 'Classic 108'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* UNO Flip! */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setDeckEdition('flip');
              }}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                deckEdition === 'flip'
                  ? 'bg-gradient-to-br from-pink-950/70 via-purple-950/60 to-slate-900 border-pink-400 ring-2 ring-pink-400/40 shadow-lg shadow-pink-950/50 scale-102'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-xs text-pink-300">UNO FLIP!</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">FEATURED</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                Double-sided cards! Flips between Light Side and brutal Dark Side (+5, Skip All). Opponents spy on your reverse side!
              </p>
            </button>

            {/* UNO No Mercy */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setDeckEdition('no_mercy');
                setMercyRule(true);
              }}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                deckEdition === 'no_mercy'
                  ? 'bg-gradient-to-br from-red-950/70 via-rose-950/60 to-slate-900 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-950/50 scale-102'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-xs text-rose-400">NO MERCY</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">EXTREME</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                Brutal +6 and +10 Wilds, Discard All, Skip Everyone. 25+ cards in hand = instant Mercy Knockout!
              </p>
            </button>

            {/* Classic */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setDeckEdition('classic');
              }}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                deckEdition === 'classic'
                  ? 'bg-gradient-to-br from-blue-950/70 to-slate-900 border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-950/50 scale-102'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-black text-xs text-sky-300">CLASSIC UNO</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">ORIGINAL</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                Traditional 108 cards, Red/Blue/Green/Yellow with standard +2 & +4 and classic casino rules.
              </p>
            </button>
          </div>
        </div>

        {/* Host Nickname */}
        <div className="flex flex-col gap-1.5 border-t border-slate-800/80 pt-3">
          <label className="text-xs font-semibold text-slate-300">Your Nickname</label>
          <input
            type="text"
            maxLength={18}
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            placeholder="Host Name"
          />
        </div>

        {/* Avatar Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300">Choose Player Avatar</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {AVATAR_LIST.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedAvatar(av);
                }}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  selectedAvatar === av
                    ? 'border-amber-400 bg-amber-400/15 shadow-md shadow-amber-950/40 scale-105'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <ModernAvatar avatar={av} size="sm" />
                <span className="text-[10px] font-medium text-slate-400 truncate w-full text-center">
                  {AVATAR_METADATA[av].name.split(' ')[1] || AVATAR_METADATA[av].name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Player Capacity Limit (2 to 8) */}
        <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Player Limit (Up to 8 Players)</span>
            </label>
            <span className="text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded-full">
              {playerLimit} Human Players
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[2, 3, 4, 5, 6, 7, 8].map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setPlayerLimit(limit);
                }}
                className={`py-1.5 sm:py-2 rounded-lg font-heading font-bold text-xs border transition-all cursor-pointer ${
                  playerLimit === limit
                    ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        </div>

        {/* Game Rules Section */}
        <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Gameplay Rules & Modifiers</h3>

          {/* Stacking Rule */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <div className="text-xs font-semibold text-white">Card Stacking (+1, +2, +5, +6, +10)</div>
              <div className="text-[11px] text-slate-400">Chain penalties onto opponents to accumulate stack</div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setStacking(!stacking);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                stacking
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {stacking ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Mercy Rule (KO at 25 cards) */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>Mercy Rule (25+ Cards = KO)</span>
                {deckEdition === 'no_mercy' && (
                  <span className="text-[9px] bg-red-600/30 text-red-300 px-1.5 py-0.2 rounded font-bold">REQUIRED</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">Eliminates any player accumulating 25 or more cards</div>
            </div>
            <button
              type="button"
              disabled={deckEdition === 'no_mercy'}
              onClick={() => {
                soundFx.playClick();
                setMercyRule(!mercyRule);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                deckEdition === 'no_mercy' || mercyRule
                  ? 'bg-rose-600/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 cursor-pointer'
              }`}
            >
              {deckEdition === 'no_mercy' || mercyRule ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Hand Size */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <div className="text-xs font-semibold text-white">Starting Hand Size</div>
              <div className="text-[11px] text-slate-400">Cards dealt to each player at round start</div>
            </div>
            <div className="flex items-center gap-1.5">
              {[5, 7, 10].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setStartingHandSize(size);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    startingHandSize === size
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Target Score */}
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-xs font-semibold text-white">Match Win Score Target</div>
              <div className="text-[11px] text-slate-400">Points needed to claim match victory</div>
            </div>
            <div className="flex items-center gap-1.5">
              {[100, 250, 500].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setTargetScore(score);
                  }}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    targetScore === score
                      ? 'bg-sky-500 text-white border-sky-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 mt-1 transition-all cursor-pointer transform active:scale-98"
        >
          <Check className="w-5 h-5" />
          <span>OPEN WI-FI LOBBY ({deckEdition.toUpperCase()})</span>
        </button>
      </div>

      <div className="text-xs text-slate-500 text-center py-2">
        NO BOTS · LOCAL WI-FI SUBNET · MULTI-DEVICE OR MULTI-TAB
      </div>
    </div>
  );
};
