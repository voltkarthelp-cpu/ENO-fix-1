import React, { useState } from 'react';
import { X, BookOpen, AlertTriangle, ShieldCheck, Flame, Ban, Repeat, RefreshCw, Skull, Sparkles, Moon } from 'lucide-react';
import { soundFx } from '../../sound/soundFx';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'flip' | 'no_mercy' | 'classic'>('flip');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-4 flex flex-col gap-4 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-white">
              Game Editions & Official Rules
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

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('flip');
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'flip'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>UNO FLIP!</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('no_mercy');
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'no_mercy'
                ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>NO MERCY</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('classic');
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'classic'
                ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CLASSIC UNO</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === 'flip' && (
            <>
              {/* UNO Flip Overview */}
              <section className="bg-slate-950/80 p-4 rounded-xl border border-pink-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-heading font-black text-sm text-pink-400">
                    UNO FLIP! Double-Sided Mechanics
                  </span>
                  <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-400/40 px-2 py-0.5 rounded-full font-bold">
                    OFFICIAL VARIATION
                  </span>
                </div>
                <p>
                  Every card in UNO Flip is <strong>double-sided</strong>! Play starts on the friendly <strong>Light Side</strong> and shifts to the brutal, aggressive <strong>Dark Side</strong> whenever a <strong>FLIP</strong> card is played.
                </p>
                <div className="mt-2 p-2.5 rounded-lg bg-pink-950/30 border border-pink-500/30 text-[11px] text-pink-200">
                  <strong>Opponent Reverse Spy Rule:</strong> In your hand, you only look at the side currently in play. However, your opponents see the <em>reverse side</em> of your cards at all times, meaning players can strategize and anticipate what will happen if someone plays a Flip card!
                </div>
              </section>

              {/* Light Side vs Dark Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Light Side */}
                <div className="p-3.5 rounded-xl bg-slate-950 border-2 border-white/80 flex flex-col gap-2">
                  <div className="font-heading font-black text-xs text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>THE LIGHT SIDE (WHITE BORDER)</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex flex-col gap-1.5">
                    <div>• <strong>Colors:</strong> Classic Red, Blue, Green, Yellow</div>
                    <div>• <strong>Numbers 0–9:</strong> Standard color or number matching cards.</div>
                    <div>• <strong>Draw One (+1):</strong> Next player draws 1 card and skips their turn.</div>
                    <div>• <strong>Reverse:</strong> Reverses play order (acts as skip in 2P).</div>
                    <div>• <strong>Skip:</strong> Skips next player's turn.</div>
                    <div>• <strong>Wild:</strong> Choose the next active color.</div>
                    <div>• <strong>Wild Draw Two (+2):</strong> Choose color, force next player to draw 2 cards and skip their turn. <em>(Can only be played if you hold no matching colors).</em></div>
                    <div>• <strong>Flip Card:</strong> Instantly triggers transformation to the Dark Side!</div>
                    <div className="text-emerald-400 text-[10px] font-semibold mt-1">✓ Mild penalties, friendly competition</div>
                  </div>
                </div>

                {/* Dark Side */}
                <div className="p-3.5 rounded-xl bg-slate-950 border-2 border-slate-900 ring-1 ring-purple-500/50 shadow-xl flex flex-col gap-2">
                  <div className="font-heading font-black text-xs text-pink-400 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-pink-400" />
                    <span>THE DARK SIDE (BLACK BORDER)</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex flex-col gap-1">
                    <div>• <strong>Colors:</strong> Neon Pink, Teal, Purple, Orange</div>
                    <div>• <strong>Border:</strong> Ominous Black Border</div>
                    <div>• <strong>Brutal Actions:</strong></div>
                    <div className="pl-2">
                      - <strong>Draw Five (+5):</strong> Victim draws 5 cards!<br />
                      - <strong>Skip Everyone:</strong> Skips all opponents, you take another turn!<br />
                      - <strong>Wild Draw Color:</strong> Victim draws cards continuously until finding chosen dark color!
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'no_mercy' && (
            <>
              {/* No Mercy Overview */}
              <section className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-heading font-black text-sm text-rose-400">
                    UNO Show 'Em No Mercy Edition
                  </span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2 py-0.5 rounded-full font-bold">
                    BRUTAL CHAOS
                  </span>
                </div>
                <p>
                  Designed with harsh, cutthroat penalties and extreme wild cards. Stacking is relentless and mistakes are heavily penalized.
                </p>
              </section>

              {/* No Mercy Unique Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-rose-900/60 flex flex-col gap-1">
                  <strong className="text-amber-400 font-bold">+10 WILD DRAW TEN</strong>
                  <span>The ultimate weapon. Target draws 10 cards (or stacks +10 onto +10)!</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-rose-900/60 flex flex-col gap-1">
                  <strong className="text-rose-400 font-bold">+6 DRAW SIX</strong>
                  <span>Stackable +6 card penalty per color.</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-rose-900/60 flex flex-col gap-1">
                  <strong className="text-sky-400 font-bold">DISCARD ALL</strong>
                  <span>Discards every single card in your hand matching this color in one move!</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-rose-900/60 flex flex-col gap-1">
                  <strong className="text-purple-400 font-bold">SKIP EVERYONE</strong>
                  <span>Skips all other players. You get an immediate second turn.</span>
                </div>

                <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-500/50 sm:col-span-2">
                  <strong className="text-red-400 font-bold flex items-center gap-1.5 mb-1">
                    <Skull className="w-4 h-4 text-red-400" />
                    <span>MERCY RULE (25+ Cards = Knockout)</span>
                  </strong>
                  <span>If any player ever holds <strong>25 or more cards</strong> in their hand, they are instantly eliminated from the round!</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'classic' && (
            <>
              {/* Classic Overview */}
              <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <h3 className="font-heading font-bold text-sm text-sky-400 mb-1">
                  Classic 108-Card Rules
                </h3>
                <p>
                  Classic Red, Blue, Green, Yellow cards with +2, Skip, Reverse, Wild, and Wild +4. Supports 2 to 8 players.
                </p>
              </section>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <strong className="text-rose-400 font-bold block">SKIP (⊘)</strong>
                  <span>Next player misses their turn.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <strong className="text-sky-400 font-bold block">REVERSE (⇄)</strong>
                  <span>Reverses order. In 2P, acts as a Skip.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <strong className="text-emerald-400 font-bold block">+2 DRAW TWO</strong>
                  <span>Next player draws 2 cards (or stacks).</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <strong className="text-purple-400 font-bold block">+4 WILD DRAW FOUR</strong>
                  <span>Chooses color and next player draws 4!</span>
                </div>
              </div>
            </>
          )}

          {/* Stacking Rule & UNO Call */}
          <section className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
            <h4 className="font-heading font-bold text-xs text-amber-400 uppercase tracking-wider">
              General Tournament Rules
            </h4>
            <div className="text-[11px] text-slate-300 flex flex-col gap-1.5">
              <div>
                • <strong>Card Stacking:</strong> When targeted by a draw penalty (+1, +2, +5, +6, +10), you can counter with your own matching penalty card to pass and build up the stack for the next player!
              </div>
              <div>
                • <strong>Calling UNO:</strong> When you have <strong>1 card left</strong>, tap <strong>CALL UNO!</strong> immediately. If an opponent catches you before your turn ends, you draw 2 penalty cards!
              </div>
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
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-heading font-bold text-sm shadow-lg shadow-amber-950/50 cursor-pointer"
        >
          RETURN TO GAME
        </button>
      </div>
    </div>
  );
};
