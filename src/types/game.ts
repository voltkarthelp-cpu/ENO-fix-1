export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';

export type CardType = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number;
  score: number;
}

export type AvatarId = 
  | 'fox' 
  | 'falcon' 
  | 'tiger' 
  | 'dragon' 
  | 'bear' 
  | 'wolf' 
  | 'viper' 
  | 'phoenix';

export interface Player {
  id: string;
  name: string;
  avatar: AvatarId;
  isBot: boolean;
  hand: Card[];
  handCount: number; // for opponents when cards are hidden
  score: number;
  isHost: boolean;
  hasCalledUno: boolean;
  isReady: boolean;
  isConnected: boolean;
  reaction?: string;
}

export interface GameRules {
  playerLimit: number;
  startingHandSize: number;
  targetScore: number;
  stacking: boolean; // whether +2 can be countered with +2 or +4
  drawUntilPlayable: boolean;
  unoPenaltyCards: number;
  turnTimeoutSeconds: number; // 0 for disabled
}

export type GamePhase = 
  | 'TITLE'
  | 'HOST_SETUP'
  | 'JOIN'
  | 'LOBBY'
  | 'PLAYING'
  | 'COLOR_PICKER'
  | 'ROUND_END'
  | 'MATCH_OVER';

export type GameMode = 'solo' | 'multiplayer' | 'pass_and_play';

export interface GameTableState {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  mode: GameMode;
  rules: GameRules;
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  discardPile: Card[];
  drawPileCount: number;
  activeColor: CardColor;
  pendingDrawPenalty: number;
  unoCallPendingPlayerId: string | null; // player who has 1 card but hasn't called uno yet
  lastActionMessage: string;
  lastActionType?: 'play' | 'draw' | 'skip' | 'reverse' | 'penalty' | 'uno' | 'wild';
  roundNumber: number;
  roundWinnerId: string | null;
  matchWinnerId: string | null;
  turnStartTime: number;
}
