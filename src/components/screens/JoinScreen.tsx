import React, { useState } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';
import { AvatarId } from '../../types/game';
import { AVATAR_METADATA, ModernAvatar } from '../modern/ModernAvatar';
import { soundFx } from '../../sound/soundFx';

interface JoinScreenProps {
  onBack: () => void;
  onConfirmJoin: (name: string, avatar: AvatarId, roomCode: string) => void;
  initialRoomCode?: string;
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

export const JoinScreen: React.FC<JoinScreenProps> = ({
  onBack,
  onConfirmJoin,
  initialRoomCode = '',
}) => {
  const [playerName, setPlayerName] = useState('Player');
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>('falcon');
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize roomCode whenever initialRoomCode changes from URL or state
  React.useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = (roomCode || initialRoomCode).trim().toUpperCase();
    if (!finalCode) {
      setErrorMsg('PLEASE ENTER A 5-LETTER ROOM CODE');
      soundFx.playError();
      return;
    }
    soundFx.playClick();
    onConfirmJoin(
      playerName.trim() || 'Player',
      selectedAvatar,
      finalCode
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-between">
      {/* Top Bar */}
      <div className="w-full max-w-lg flex items-center justify-between border-b border-slate-800 pb-4">
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

        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Connect to Room
        </span>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleJoin}
        className="my-auto w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-5"
      >
        <div className="border-b border-slate-800 pb-3">
          <h2 className="font-heading font-bold text-xl text-white">
            Join Game Lobby
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect to a friend's room on the same local Wi-Fi.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Room Code */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Room Code</label>
          <input
            type="text"
            maxLength={6}
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setErrorMsg('');
            }}
            placeholder="e.g. CLASH"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 font-heading font-extrabold text-xl text-amber-400 tracking-widest text-center focus:outline-none focus:border-amber-400 uppercase transition-colors"
            autoFocus
          />
        </div>

        {/* Player Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Your Nickname</label>
          <input
            type="text"
            maxLength={18}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player Nickname"
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Avatar Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300">Choose Avatar</label>
          <div className="grid grid-cols-4 gap-2">
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

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-heading font-bold text-sm shadow-lg shadow-sky-950/60 flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer transform active:scale-98"
        >
          <LogIn className="w-5 h-5" />
          <span>JOIN LOBBY</span>
        </button>
      </form>

      <div className="text-xs text-slate-500 text-center">
        REAL-TIME WI-FI SYNCHRONIZATION
      </div>
    </div>
  );
};
