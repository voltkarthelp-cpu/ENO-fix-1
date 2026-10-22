import React from 'react';
import { Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { GameTableState } from '../../types/game';
import { ModernAvatar } from '../modern/ModernAvatar';
import { soundFx } from '../../sound/soundFx';

interface RoundEndModalProps {
  tableState: GameTableState;
  onNextRound: () => void;
  onRestartMatch: () => void;
  isHost: boolean;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  tableState,
  onNextRound,
  onRestartMatch,
  isHost,
}) => {
  const winner = tableState.players.find((p) => p.id === tableState.roundWinnerId);
  const matchWinner = tableState.players.find((p) => p.id === tableState.matchWinnerId);
  const isMatchOver = !!matchWinner;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center gap-5">
        {/* Header Trophy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-xl shadow-amber-950/50 flex items-center justify-center animate-bounce">
          <Trophy className="w-8 h-8 text-slate-950 fill-current" />
        </div>

        {/* Title */}
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            {isMatchOver ? 'Match Champion!' : `Round ${tableState.roundNumber} Complete!`}
          </span>
          <h2 className="font-heading font-extrabold text-2xl text-white mt-1">
            {isMatchOver ? matchWinner?.name : winner?.name} Wins!
          </h2>
        </div>

        {/* Winner Avatar */}
        {winner && (
          <div className="flex flex-col items-center gap-1.5">
            <ModernAvatar avatar={winner.avatar} size="lg" />
            <span className="font-semibold text-sm text-slate-200 mt-1">{winner.name}</span>
          </div>
        )}

        {/* Scoreboard table */}
        <div className="w-full bg-slate-950/80 rounded-2xl border border-slate-800 p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Player</span>
            <span>Total Score / {tableState.rules.targetScore}</span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            {tableState.players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors ${
                  p.id === winner?.id ? 'bg-amber-400/10 text-amber-300 font-bold' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ModernAvatar avatar={p.avatar} size="xs" />
                  <span>{p.name}</span>
                </div>
                <span className="font-heading font-bold text-sm tabular-nums">{p.score} PTS</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Action */}
        <div className="w-full mt-1">
          {isHost ? (
            isMatchOver ? (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onRestartMatch();
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-heading font-bold text-sm shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>START NEW MATCH</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onNextRound();
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>DEAL NEXT ROUND</span>
              </button>
            )
          ) : (
            <div className="w-full py-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-semibold text-amber-400 animate-pulse">
              Waiting for host to deal next round...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
