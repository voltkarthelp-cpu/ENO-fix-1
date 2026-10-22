import React from 'react';
import { X, BookOpen, AlertTriangle, ShieldCheck, Flame, Ban, Repeat } from 'lucide-react';
import { soundFx } from '../../sound/soundFx';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-6 flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-heading font-extrabold text-xl text-white">
              Card Clash Rules & Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-4 text-xs leading-relaxed text-slate-300 max-h-[65vh] overflow-y-auto pr-1">
          {/* Objective */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="font-heading font-bold text-sm text-amber-400 mb-1">
              01. Objective & Capacity
            </h3>
            <p>
              Be the first player to discard all cards in your hand. Supports <strong>2 to 8 real human players</strong> over local Wi-Fi or Pass & Play. Points are calculated from the remaining cards held by your opponents. The first player to reach the match score target (default 250) claims victory!
            </p>
          </section>

          {/* Action Cards */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
            <h3 className="font-heading font-bold text-sm text-amber-400">
              02. Action Cards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" />
                  <span>SKIP</span>
                </div>
                <span>The next player in turn rotation misses their turn.</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  <span>REVERSE</span>
                </div>
                <span>Reverses direction. <em>In a 2-player match, acts as a Skip!</em></span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <strong className="text-emerald-400 font-bold block">+2 DRAW TWO</strong>
                <span>Next player draws 2 cards (or chains if Stacking is enabled).</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                <strong className="text-amber-400 font-bold block">★ WILD</strong>
                <span>Can be played on any card. Chooses next active color.</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 sm:col-span-2 flex flex-col gap-1">
                <strong className="text-purple-400 font-bold block">+4 WILD DRAW FOUR</strong>
                <span>Chooses active color and next player must draw 4 cards!</span>
              </div>
            </div>
          </section>

          {/* Stacking Rule */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="font-heading font-bold text-sm text-amber-400 mb-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>03. Card Stacking (+2 / +4)</span>
            </h3>
            <p>
              When enabled by the host, if you are targeted by a <strong>+2</strong>, you can immediately counter by playing your own <strong>+2</strong>! The penalty accumulates (+4, +6...) and gets passed down to the next player until someone cannot counter and must draw the entire accumulated pool.
            </p>
          </section>

          {/* Calling UNO */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="font-heading font-bold text-sm text-amber-400 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>04. Calling UNO & Catch Penalty</span>
            </h3>
            <p>
              When you play down to <strong>1 CARD LEFT</strong>, remember to tap the <strong>CALL UNO!</strong> button. If you forget and another opponent hits <strong>CATCH UNO!</strong>, you will be penalized by drawing 2 penalty cards.
            </p>
          </section>

          {/* Scoring */}
          <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="font-heading font-bold text-sm text-amber-400 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>05. Scoring Values</span>
            </h3>
            <div className="flex flex-wrap gap-3 text-slate-300">
              <span>Numbers 0–9: <strong className="text-white">Face Value</strong></span>
              <span>·</span>
              <span>Actions (Skip/Reverse/+2): <strong className="text-white">20 Points</strong></span>
              <span>·</span>
              <span>Wild & Wild +4: <strong className="text-white">50 Points</strong></span>
            </div>
          </section>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-heading font-bold text-sm shadow-lg shadow-amber-950/50 cursor-pointer"
        >
          RETURN TO GAME
        </button>
      </div>
    </div>
  );
};
