export type ClassicCardColor = 'red' | 'blue' | 'green' | 'yellow';
export type DarkCardColor = 'pink' | 'teal' | 'purple' | 'orange';
export type CardColor = ClassicCardColor | DarkCardColor | 'wild' | 'dark_wild';

export type CardType = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip'
  | 'reverse'
  | 'draw1'
  | 'draw2'
  | 'draw5'
  | 'draw6'
  | 'draw10'
  | 'flip'
  | 'skip_everyone'
  | 'discard_all'
  | 'wild'
  | 'wild2'
  | 'wild4'
  | 'wild_color';

export interface CardFace {
  color: CardColor;
  type: CardType;
  value?: number;
  score: number;
}

export interface Card {
  id: string;
  // Default / Light side face
  color: CardColor;
  type: CardType;
  value?: number;
  score: number;
  // Dark side face for UNO Flip!
  darkFace?: CardFace;
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
  isEliminated?: boolean;
}

export type GameDeckEdition = 'flip' | 'no_mercy' | 'classic';

export interface GameRules {
  deckEdition: GameDeckEdition;
  playerLimit: number;
  startingHandSize: number;
  targetScore: number;
  stacking: boolean; // whether draw penalties can be stacked
  drawUntilPlayable: boolean;
  unoPenaltyCards: number;
  turnTimeoutSeconds: number; // 0 for disabled
  mercyRule: boolean; // No Mercy: 25+ cards in hand = knocked out
  sevenZeroRule: boolean; // 7 swaps hands, 0 rotates hands
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
  lastActionType?: 'play' | 'draw' | 'skip' | 'reverse' | 'penalty' | 'uno' | 'wild' | 'flip' | 'mercy';
  roundNumber: number;
  roundWinnerId: string | null;
  matchWinnerId: string | null;
  turnStartTime: number;
  currentSide: 'light' | 'dark'; // UNO Flip state
  eliminatedPlayerIds?: string[]; // No Mercy mode KO list
}
