import React from 'react';
import { X, Server, Terminal, Shield, Cpu, Zap } from 'lucide-react';
import { soundFx } from '../../sound/soundFx';

interface DiagnosticsModalProps {
  onClose: () => void;
  roomCode?: string;
  connectedCount?: number;
  onOpenSupabaseSettings?: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  onClose,
  roomCode = 'CLASH',
  connectedCount = 1,
  onOpenSupabaseSettings,
}) => {
  const [serverInfo, setServerInfo] = React.useState<{
    lanIps?: string[];
    port?: number;
    preferredLanUrl?: string | null;
  } | null>(null);

  React.useEffect(() => {
    fetch('/api/server-info')
      .then((r) => r.json())
      .then((d) => setServerInfo(d))
      .catch(() => {});
  }, []);

  const ipDisplay = serverInfo?.lanIps?.[0]
    ? `${serverInfo.lanIps[0]}:${serverInfo.port || 3000}`
    : typeof window !== 'undefined'
    ? `${window.location.hostname}:${window.location.port || '3000'}`
    : 'Active Port 3000';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-6 flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-emerald-400" />
            <h2 className="font-heading font-extrabold text-xl text-white">
              Host Server & Wi-Fi Architecture
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

        {/* Server Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Server Engine</span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 block">Active (Authoritative)</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Local IP:Port</span>
            <span className="text-xs font-bold text-amber-400 mt-0.5 block truncate px-1" title={ipDisplay}>
              {ipDisplay}
            </span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Active Room</span>
            <span className="text-xs font-bold text-sky-400 mt-0.5 block">#{roomCode}</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Capacity</span>
            <span className="text-xs font-bold text-white mt-0.5 block">{connectedCount}/8 Players</span>
          </div>
        </div>

        {/* Technical Architecture Overview */}
        <div className="flex flex-col gap-3.5 max-h-[55vh] overflow-y-auto pr-1 text-xs text-slate-300">
          <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="font-heading font-bold text-sm text-amber-400 mb-1 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>Multiplayer Wi-Fi Architecture</span>
            </h3>
            <p className="leading-relaxed">
              One device acts as the authoritative game host. The host server coordinates state broadcast over WebSockets and local subnet broadcast without cloud accounts or third-party servers.
            </p>
            <div className="mt-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-400">
              dependencies {'{'}<br />
              &nbsp;&nbsp;implementation 'org.nanohttpd:nanohttpd:2.3.1'<br />
              &nbsp;&nbsp;implementation 'org.java-websocket:Java-WebSocket:1.5.4'<br />
              &nbsp;&nbsp;implementation 'com.google.code.gson:gson:2.10.1'<br />
              {'}'}
            </div>
          </section>

          <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="font-heading font-bold text-sm text-emerald-400 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Fairness & Private Hands Isolation</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Authoritative Deck & Hands:</strong> Private player cards are kept strictly secret. Opponents only receive card counts, making inspection impossible.</li>
              <li><strong>Turn Enforcement:</strong> Only the current active player can play or draw. Invalid turns are rejected.</li>
              <li><strong>8-Player Scaling:</strong> Dynamic rotation handling for 2 up to 8 real human players with custom stacking and Uno penalty logic.</li>
            </ul>
          </section>

          <section className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <h3 className="font-heading font-bold text-sm text-sky-400 mb-1 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>Live Multi-Tab & Device Testing</span>
            </h3>
            <p>
              Open this app in multiple browser tabs or devices on the same network using the Room Code or invite link. All actions sync in real-time.
            </p>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {onOpenSupabaseSettings && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
                onOpenSupabaseSettings();
              }}
              className="w-full sm:flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>CONFIGURE SUPABASE REALTIME</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-heading font-bold text-sm border border-slate-700 cursor-pointer transition-colors"
          >
            CLOSE CONSOLE
          </button>
        </div>
      </div>
    </div>
  );
};
