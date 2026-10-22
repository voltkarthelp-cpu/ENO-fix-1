import React, { useState } from 'react';
import { ArrowLeft, Wifi, Check, Settings2, Users } from 'lucide-react';
import { AvatarId, GameRules } from '../../types/game';
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
  const [playerLimit, setPlayerLimit] = useState(8); // Maximum 8 players
  const [stacking, setStacking] = useState(true);
  const [startingHandSize, setStartingHandSize] = useState(7);
  const [targetScore, setTargetScore] = useState(250);
  const [drawUntilPlayable, setDrawUntilPlayable] = useState(false);
  const [unoPenaltyCards, setUnoPenaltyCards] = useState(2);

  const handleStart = () => {
    soundFx.playClick();
    onConfirmHost(
      hostName.trim() || 'Host',
      selectedAvatar,
      {
        playerLimit,
        startingHandSize,
        targetScore,
        stacking,
        drawUntilPlayable,
        unoPenaltyCards,
        turnTimeoutSeconds: 0,
      },
      defaultRoomCode
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-between">
      {/* Top Header */}
      <div className="w-full max-w-2xl flex items-center justify-between border-b border-slate-800 pb-4">
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
      <div className="my-auto w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-amber-400" />
            <span>Room Setup & Player Capacity</span>
          </h2>
          <span className="text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-1 rounded-full tracking-wider">
            ROOM: #{defaultRoomCode}
          </span>
        </div>

        {/* Host Nickname */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Your Nickname</label>
          <input
            type="text"
            maxLength={18}
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            placeholder="Host Name"
          />
        </div>

        {/* Avatar Picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300">Choose Player Avatar</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
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
        <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-4">
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
                className={`py-2 rounded-lg font-heading font-bold text-xs border transition-all cursor-pointer ${
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
        <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Rules</h3>

          {/* Stacking Rule */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <div className="text-xs font-semibold text-white">Card Stacking (+2 & +4)</div>
              <div className="text-xs text-slate-400">Chain +2 onto +2 to pass draw penalty to next player</div>
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

          {/* Hand Size */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <div className="text-xs font-semibold text-white">Starting Hand Size</div>
              <div className="text-xs text-slate-400">Cards dealt to each player at round start</div>
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
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
              <div className="text-xs text-slate-400">Points needed to claim match victory</div>
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
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
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer transform active:scale-98"
        >
          <Check className="w-5 h-5" />
          <span>OPEN WI-FI LOBBY FOR {playerLimit} PLAYERS</span>
        </button>
      </div>

      <div className="text-xs text-slate-500 text-center">
        NO BOTS · LOCAL WI-FI SUBNET · MULTI-DEVICE OR MULTI-TAB
      </div>
    </div>
  );
};
