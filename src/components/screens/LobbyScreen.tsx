import React, { useState } from 'react';
import { ArrowLeft, Play, Copy, Check, QrCode, UserMinus, Users, Wifi, ExternalLink, Zap } from 'lucide-react';
import { GameRules, Player } from '../../types/game';
import { ModernAvatar } from '../modern/ModernAvatar';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { soundFx } from '../../sound/soundFx';

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  localPlayerId: string;
  isHost: boolean;
  rules: GameRules;
  onRemovePlayer: (id: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onOpenSupabaseSettings?: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode,
  players,
  localPlayerId,
  isHost,
  rules,
  onRemovePlayer,
  onStartGame,
  onLeaveRoom,
  onOpenSupabaseSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [serverInfo, setServerInfo] = useState<{
    lanIps?: string[];
    port?: number;
    preferredLanUrl?: string | null;
    appUrl?: string | null;
  } | null>(null);
  const [customHostUrl, setCustomHostUrl] = useState('');
  const [showUrlEditor, setShowUrlEditor] = useState(false);

  React.useEffect(() => {
    fetch('/api/server-info')
      .then((r) => r.json())
      .then((data) => {
        setServerInfo(data);
        if (
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
          data.preferredLanUrl
        ) {
          setCustomHostUrl(data.preferredLanUrl);
        }
      })
      .catch(() => {});
  }, []);

  const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const effectiveBaseUrl = customHostUrl.trim() || defaultOrigin;
  const inviteUrl = `${effectiveBaseUrl}${typeof window !== 'undefined' ? window.location.pathname : '/'}?room=${roomCode}`;

  const handleCopyLink = () => {
    soundFx.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleOpenNewTab = () => {
    soundFx.playClick();
    if (typeof window !== 'undefined') {
      window.open(inviteUrl, '_blank');
    }
  };

  const canStart = players.length >= 2;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-between">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onLeaveRoom();
          }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>LEAVE ROOM</span>
        </button>

        <div className="flex items-center gap-3">
          {onOpenSupabaseSettings && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenSupabaseSettings();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-semibold cursor-pointer transition-colors"
              title="Realtime connection engine settings"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>REALTIME SYNC</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Room #{roomCode}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
        {/* Left Column: QR & Invite Info */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col items-center text-center justify-between gap-5">
          <div className="w-full">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Room Code
            </span>
            <div className="font-heading font-black text-3xl text-amber-400 tracking-widest my-1 select-all">
              {roomCode}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Same Wi-Fi Network</span>
            </div>
          </div>

          {/* QR Code & Wi-Fi Target */}
          <div className="flex flex-col items-center p-3 bg-white rounded-xl shadow-inner w-full">
            <QrCodeSvg value={inviteUrl} size={135} />
            <span className="text-[11px] font-bold text-slate-800 mt-2 tracking-wider">
              SCAN WITH PHONE CAMERA
            </span>
          </div>

          {/* Wi-Fi Host Address Info & Editor */}
          <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-left text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Wi-Fi Host Address:
              </span>
              <button
                type="button"
                onClick={() => setShowUrlEditor(!showUrlEditor)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
              >
                {showUrlEditor ? 'Done' : 'Change IP'}
              </button>
            </div>
            <div className="font-mono text-[11px] text-emerald-400 truncate bg-slate-900 px-2 py-1 rounded border border-slate-800 select-all">
              {effectiveBaseUrl}
            </div>

            {showUrlEditor && (
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-col gap-1.5 animate-in fade-in duration-150">
                <label className="text-[10px] text-slate-400">
                  Enter Computer's Wi-Fi IP or Port:
                </label>
                <input
                  type="text"
                  value={customHostUrl}
                  onChange={(e) => setCustomHostUrl(e.target.value)}
                  placeholder="http://192.168.1.50:3000"
                  className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                {serverInfo?.lanIps && serverInfo.lanIps.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[9px] text-slate-500 w-full">Detected Wi-Fi IPs:</span>
                    {serverInfo.lanIps.map((ip) => {
                      const candidate = `http://${ip}:${serverInfo.port || 3000}`;
                      return (
                        <button
                          key={ip}
                          type="button"
                          onClick={() => setCustomHostUrl(candidate)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-mono text-[10px] border border-slate-700 cursor-pointer"
                        >
                          {ip}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share Actions */}
          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'LINK COPIED!' : 'COPY JOIN LINK'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="w-full py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 text-sky-400 font-medium text-xs border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Open player in a second tab to test multiplayer right now"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>OPEN SECOND TAB (TEST)</span>
            </button>
          </div>
        </div>

        {/* Center / Right Columns: Connected Players & Controls */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 flex-wrap gap-2">
              <h2 className="font-heading font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <span>Connected Players ({players.length}/{rules.playerLimit})</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  rules.deckEdition === 'flip'
                    ? 'bg-pink-950/70 text-pink-300 border-pink-500/60'
                    : rules.deckEdition === 'no_mercy'
                    ? 'bg-red-950/70 text-red-300 border-red-500/60'
                    : 'bg-blue-950/70 text-sky-300 border-sky-500/60'
                }`}>
                  {rules.deckEdition === 'flip' ? 'UNO FLIP! (DOUBLE-SIDED)' : rules.deckEdition === 'no_mercy' ? 'UNO NO MERCY' : 'CLASSIC UNO'}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Max {rules.playerLimit}P
                </span>
              </div>
            </div>

            {/* Players Grid (supporting up to 8 players) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {players.map((p, idx) => {
                const isLocal = p.id === localPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      isLocal
                        ? 'bg-slate-800/90 border-amber-400/80 shadow-md shadow-amber-950/20'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ModernAvatar avatar={p.avatar} size="sm" />
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                          <span className="truncate max-w-[120px]">{p.name}</span>
                          {p.isHost && (
                            <span className="text-[10px] font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded-full uppercase">
                              HOST
                            </span>
                          )}
                          {isLocal && (
                            <span className="text-[10px] font-bold bg-sky-600/30 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded-full uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          Player #{idx + 1} · Connected
                        </div>
                      </div>
                    </div>

                    {isHost && !p.isHost && (
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          onRemovePlayer(p.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remove Player"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Waiting slots */}
              {Array.from({ length: Math.min(rules.playerLimit - players.length, 8 - players.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="p-3.5 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/30 flex items-center justify-center text-slate-500 text-xs font-medium"
                >
                  Waiting for Player {players.length + i + 1}...
                </div>
              ))}
            </div>
          </div>

          {/* Rules Banner */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>Stacking: <strong className="text-slate-200">{rules.stacking ? 'ON' : 'OFF'}</strong></span>
            <span>·</span>
            <span>Starting Hand: <strong className="text-slate-200">{rules.startingHandSize} cards</strong></span>
            <span>·</span>
            <span>Target: <strong className="text-slate-200">{rules.targetScore} pts</strong></span>
            <span>·</span>
            <span>Penalty: <strong className="text-slate-200">+{rules.unoPenaltyCards}</strong></span>
          </div>

          {/* Bottom Action Area */}
          <div>
            {isHost ? (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onStartGame();
                }}
                disabled={!canStart}
                className={`w-full py-4 rounded-xl font-heading font-bold text-base shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  canStart
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-950/50 transform hover:-translate-y-0.5 active:translate-y-0'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{canStart ? 'START GAME (ALL PLAYERS READY)' : 'NEED AT LEAST 2 PLAYERS TO START'}</span>
              </button>
            ) : (
              <div className="w-full py-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-heading font-semibold text-sm text-amber-400 animate-pulse">
                Waiting for host to start game...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 text-center">
        NO BOTS · HUMAN WI-FI MULTIPLAYER · UP TO 8 PLAYERS
      </div>
    </div>
  );
};
