import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, AlertCircle, RefreshCw, Radio, Zap, ShieldCheck } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, isSupabaseConfigured } from '../../game/supabaseClient';
import { networkSync, RealtimeStatusInfo } from '../../game/networkSync';
import { soundFx } from '../../sound/soundFx';

interface SupabaseSettingsModalProps {
  onClose: () => void;
  roomCode?: string;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  onClose,
  roomCode,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [status, setStatus] = useState<RealtimeStatusInfo>(networkSync.getStatus());

  useEffect(() => {
    const unsub = networkSync.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsub;
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    saveSupabaseConfig(url, anonKey);
    setSaveSuccess(true);

    if (roomCode) {
      networkSync.startServerSync(roomCode, true);
    }

    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  const handleClear = () => {
    soundFx.playClick();
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    if (roomCode) {
      networkSync.startServerSync(roomCode, true);
    }
  };

  const isConfigured = Boolean(url.trim() && anonKey.trim());

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-6 flex flex-col gap-5 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
                <span>Supabase Real-Time Engine</span>
              </h2>
              <span className="text-xs text-slate-400">
                Sub-50ms WebSocket multiplayer channels across any network
              </span>
            </div>
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

        {/* Live Realtime Connection Status Pill */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                status.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <div>
              <div className="font-heading font-bold text-sm text-white flex items-center gap-2">
                <span>Active Backend:</span>
                <span className="text-emerald-400 uppercase tracking-wider font-mono">
                  {status.type === 'supabase'
                    ? 'Supabase Realtime (WebSockets)'
                    : status.type === 'server_sse'
                    ? 'Server Stream (SSE + HTTP)'
                    : 'Local Broadcast (Tabs)'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Channel: <span className="font-mono text-slate-300">{status.channelName}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                status.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {status.connected ? 'CONNECTED' : 'CONNECTING'}
            </span>
          </div>
        </div>

        {/* Supabase Credentials Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Supabase Project URL</span>
              <span className="text-[10px] text-slate-500">e.g. https://your-ref.supabase.co</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzproject.supabase.co"
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-400 text-xs font-mono text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Supabase Anon Public Key</span>
              <span className="text-[10px] text-slate-500">Safe for client-side Realtime</span>
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-400 text-xs font-mono text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-1">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveSuccess ? 'CONFIG SAVED & CONNECTED!' : 'CONNECT SUPABASE REALTIME'}</span>
            </button>

            {isConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 hover:text-rose-400 text-slate-400 font-semibold text-xs cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Feature Highlights */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Dual-Engine Realtime Architecture:</strong> When Supabase credentials are configured, players sync over Supabase Realtime WebSockets. When running locally without Supabase, the built-in Server-Sent Events (SSE) server handles instant cross-device Wi-Fi play seamlessly.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Zero Cloud Accounts Required for Peers:</strong> Only the host or room needs to connect; all joined players immediately share the WebSocket channel without individual login.
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-semibold text-xs border border-slate-700 cursor-pointer transition-colors"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
