import { Card, CardColor, GameTableState, Player } from '../types/game';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type NetworkMessage =
  | { type: 'JOIN_REQUEST'; roomCode: string; player: Player }
  | { type: 'LOBBY_UPDATE'; roomCode: string; players: Player[]; hostId: string }
  | { type: 'GAME_STARTED'; roomCode: string; tableState: GameTableState }
  | { type: 'TABLE_SYNC'; roomCode: string; tableState: GameTableState }
  | { type: 'ACTION_PLAY'; roomCode: string; playerId: string; cardId: string; chosenColor?: CardColor; calledUno?: boolean; id?: string }
  | { type: 'ACTION_DRAW'; roomCode: string; playerId: string; id?: string }
  | { type: 'ACTION_CALL_UNO'; roomCode: string; playerId: string; id?: string }
  | { type: 'ACTION_CATCH_UNO'; roomCode: string; catcherId: string; targetPlayerId: string; id?: string }
  | { type: 'HOST_LEAVE'; roomCode: string };

export type RealtimeBackendType = 'supabase' | 'server_sse' | 'local';

export interface RealtimeStatusInfo {
  type: RealtimeBackendType;
  connected: boolean;
  channelName: string;
  onlineCount?: number;
}

class NetworkSyncManager {
  private localBroadcastChannel: BroadcastChannel | null = null;
  private messageListeners: ((msg: NetworkMessage) => void)[] = [];
  private statusListeners: ((status: RealtimeStatusInfo) => void)[] = [];
  private activeRoomCode: string = '';
  private currentIsHost: boolean = false;

  // Supabase Realtime channel
  private supabaseChannel: RealtimeChannel | null = null;
  private supabaseConnected: boolean = false;

  // Server SSE connection
  private eventSource: EventSource | null = null;
  private sseConnected: boolean = false;

  // Fallback Polling Abort Controller
  private pollAbortController: AbortController | null = null;
  private currentVersion: number = 0;
  private processedActionIds = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localBroadcastChannel = new BroadcastChannel('card_clash_sync_bus');
        this.localBroadcastChannel.onmessage = (event) => {
          this.handleIncoming(event.data);
        };
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'card_clash_latest_msg' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleIncoming(data);
          } catch {}
        }
      });
    }
  }

  public subscribe(listener: (msg: NetworkMessage) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }

  public subscribeStatus(listener: (status: RealtimeStatusInfo) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  public getStatus(): RealtimeStatusInfo {
    if (this.supabaseConnected) {
      return {
        type: 'supabase',
        connected: true,
        channelName: `room_${this.activeRoomCode}`,
      };
    }
    if (this.sseConnected) {
      return {
        type: 'server_sse',
        connected: true,
        channelName: `sse_${this.activeRoomCode}`,
      };
    }
    return {
      type: 'local',
      connected: !!this.activeRoomCode,
      channelName: this.activeRoomCode ? `local_${this.activeRoomCode}` : 'none',
    };
  }

  private notifyStatus() {
    const status = this.getStatus();
    this.statusListeners.forEach((l) => {
      try {
        l(status);
      } catch {}
    });
  }

  private handleIncoming(msg: any) {
    if (!msg || !msg.type) return;

    // Filter by room code if active
    if (this.activeRoomCode && msg.roomCode) {
      if (msg.roomCode.toUpperCase() !== this.activeRoomCode.toUpperCase()) {
        return;
      }
    }

    // Deduplicate actions
    if (msg.id) {
      if (this.processedActionIds.has(msg.id)) {
        return;
      }
      this.processedActionIds.add(msg.id);
      if (this.processedActionIds.size > 200) {
        const first = this.processedActionIds.values().next().value;
        if (first) this.processedActionIds.delete(first);
      }
    }

    this.messageListeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in network message handler', err);
      }
    });
  }

  public broadcast(msg: NetworkMessage) {
    const enrichedMsg = {
      ...msg,
      roomCode: (msg.roomCode || this.activeRoomCode).toUpperCase(),
      id: (msg as any).id || Date.now() + Math.random().toString(36),
    };

    // 1. Same-device local tabs
    if (this.localBroadcastChannel) {
      try {
        this.localBroadcastChannel.postMessage(enrichedMsg);
      } catch {}
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'card_clash_latest_msg',
          JSON.stringify({ ...enrichedMsg, _t: Date.now() })
        );
      } catch {}
    }

    // 2. Supabase Realtime broadcast (if configured and connected)
    if (this.supabaseChannel && this.supabaseConnected) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: enrichedMsg.type,
          payload: enrichedMsg,
        });
      } catch (err) {
        console.warn('Supabase broadcast failed, falling back to server', err);
      }
    }

    // 3. Server HTTP push (for multi-device / Wi-Fi play and SSE streaming)
    this.pushToServer(enrichedMsg);
  }

  private async pushToServer(msg: any) {
    if (typeof window === 'undefined') return;
    try {
      const code = msg.roomCode.toUpperCase();
      if (msg.type === 'JOIN_REQUEST') {
        await fetch(`/api/rooms/${code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player: msg.player }),
        });
      } else if (msg.type === 'TABLE_SYNC' || msg.type === 'GAME_STARTED') {
        await fetch(`/api/rooms/${code}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableState: msg.tableState }),
        });
      } else if (msg.type === 'LOBBY_UPDATE') {
        await fetch(`/api/rooms/${code}/lobby`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players: msg.players, hostId: msg.hostId }),
        });
      } else if (
        msg.type === 'ACTION_PLAY' ||
        msg.type === 'ACTION_DRAW' ||
        msg.type === 'ACTION_CALL_UNO' ||
        msg.type === 'ACTION_CATCH_UNO'
      ) {
        await fetch(`/api/rooms/${code}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: msg }),
        });
      }
    } catch {
      // Offline fallback
    }
  }

  public async leaveRoom(roomCode: string, playerId: string) {
    if (typeof window === 'undefined') return;
    try {
      await fetch(`/api/rooms/${roomCode.toUpperCase()}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    } catch {}
  }

  /**
   * Start real-time sync across devices via Supabase Realtime and Server SSE
   */
  public startServerSync(roomCode: string, isHost: boolean) {
    const code = roomCode.toUpperCase();
    this.activeRoomCode = code;
    this.currentIsHost = isHost;
    this.stopServerSync();

    // 1. Initialize Supabase Realtime channel if available
    this.setupSupabaseRealtime(code, isHost);

    // 2. Initialize Server SSE channel
    this.setupServerSSE(code, isHost);
  }

  private setupSupabaseRealtime(roomCode: string, isHost: boolean) {
    if (!isSupabaseConfigured()) {
      return;
    }

    const client = getSupabaseClient();
    if (!client) return;

    try {
      const channelName = `card_clash_${roomCode}`;
      const channel = client.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: isHost ? 'host' : 'peer' },
        },
      });

      // Listen for all broadcast events
      channel.on('broadcast', { event: '*' }, (event) => {
        if (event.payload) {
          this.handleIncoming(event.payload);
        }
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.supabaseConnected = true;
          this.notifyStatus();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.supabaseConnected = false;
          this.notifyStatus();
        }
      });

      this.supabaseChannel = channel;
    } catch (err) {
      console.warn('Failed to setup Supabase Realtime:', err);
      this.supabaseConnected = false;
    }
  }

  private setupServerSSE(roomCode: string, isHost: boolean) {
    if (typeof window === 'undefined' || !('EventSource' in window)) {
      this.setupFallbackPolling(roomCode, isHost);
      return;
    }

    try {
      const url = `/api/rooms/${roomCode}/events`;
      const es = new EventSource(url);

      es.onopen = () => {
        this.sseConnected = true;
        this.notifyStatus();
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data) return;

          if (data.type === 'INIT_STATE' && data.room) {
            const room = data.room;
            if (!isHost) {
              if (room.tableState) {
                this.handleIncoming({
                  type: 'TABLE_SYNC',
                  roomCode,
                  tableState: room.tableState,
                });
              } else if (room.players) {
                this.handleIncoming({
                  type: 'LOBBY_UPDATE',
                  roomCode,
                  players: room.players,
                  hostId: room.hostId,
                });
              }
            } else if (room.players) {
              this.handleIncoming({
                type: 'LOBBY_UPDATE',
                roomCode,
                players: room.players,
                hostId: room.hostId,
              });
            }
          } else if (data.type === 'TABLE_SYNC' && data.tableState) {
            if (!isHost) {
              this.handleIncoming({
                type: 'TABLE_SYNC',
                roomCode,
                tableState: data.tableState,
              });
            }
          } else if (data.type === 'LOBBY_UPDATE') {
            this.handleIncoming({
              type: 'LOBBY_UPDATE',
              roomCode,
              players: data.players,
              hostId: data.hostId,
            });
          } else if (data.type === 'PLAYER_JOINED') {
            if (isHost && data.player) {
              this.handleIncoming({
                type: 'JOIN_REQUEST',
                roomCode,
                player: data.player,
              });
            } else if (data.room?.players) {
              this.handleIncoming({
                type: 'LOBBY_UPDATE',
                roomCode,
                players: data.room.players,
                hostId: data.room.hostId,
              });
            }
          } else if (data.type === 'ACTION' && data.action) {
            if (isHost) {
              this.handleIncoming(data.action);
            }
          } else if (data.type === 'PLAYER_LEFT' && data.room?.players) {
            this.handleIncoming({
              type: 'LOBBY_UPDATE',
              roomCode,
              players: data.room.players,
              hostId: data.room.hostId,
            });
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      es.onerror = () => {
        this.sseConnected = false;
        this.notifyStatus();
      };

      this.eventSource = es;
    } catch {
      this.setupFallbackPolling(roomCode, isHost);
    }
  }

  private setupFallbackPolling(roomCode: string, isHost: boolean) {
    this.pollAbortController = new AbortController();
    const signal = this.pollAbortController.signal;

    const poll = async () => {
      if (signal.aborted || !this.activeRoomCode) return;
      try {
        const res = await fetch(`/api/rooms/${this.activeRoomCode}/poll?version=${this.currentVersion}`, { signal });
        if (res.ok) {
          const room = await res.json();
          if (room && !room.noChange) {
            this.currentVersion = room.version;

            if (isHost && room.actions && Array.isArray(room.actions)) {
              room.actions.forEach((act: any) => {
                if (act.id && !this.processedActionIds.has(act.id)) {
                  this.processedActionIds.add(act.id);
                  this.handleIncoming(act);
                }
              });
            }

            if (!isHost) {
              if (room.tableState) {
                this.handleIncoming({
                  type: 'TABLE_SYNC',
                  roomCode: this.activeRoomCode,
                  tableState: room.tableState,
                });
              } else if (room.players) {
                this.handleIncoming({
                  type: 'LOBBY_UPDATE',
                  roomCode: this.activeRoomCode,
                  players: room.players,
                  hostId: room.hostId,
                });
              }
            } else if (room.players) {
              this.handleIncoming({
                type: 'LOBBY_UPDATE',
                roomCode: this.activeRoomCode,
                players: room.players,
                hostId: room.hostId,
              });
            }
          }
        }
      } catch {}

      if (!signal.aborted) {
        setTimeout(poll, 600);
      }
    };

    poll();
  }

  public stopServerSync() {
    if (this.supabaseChannel) {
      try {
        const client = getSupabaseClient();
        if (client) {
          client.removeChannel(this.supabaseChannel);
        }
      } catch {}
      this.supabaseChannel = null;
      this.supabaseConnected = false;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.sseConnected = false;
    }

    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = null;
    }

    this.notifyStatus();
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const networkSync = new NetworkSyncManager();
