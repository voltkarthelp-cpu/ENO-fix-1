import { Card, CardColor, CardType, GameRules, GameTableState, Player } from '../types/game';

// Card score lookup
export const getCardScore = (type: CardType): number => {
  if (type === 'wild' || type === 'wild4') return 50;
  if (type === 'skip' || type === 'reverse' || type === 'draw2') return 20;
  return parseInt(type, 10) || 0;
};

// Generate standard 108 card UNO deck
export const createStandardDeck = (): Card[] => {
  const cards: Card[] = [];
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  let idCounter = 1;

  colors.forEach((color) => {
    // One 0 per color
    cards.push({
      id: `c_${idCounter++}`,
      color,
      type: '0',
      value: 0,
      score: 0,
    });

    // Two of each 1-9 per color
    for (let num = 1; num <= 9; num++) {
      const typeStr = num.toString() as CardType;
      cards.push({
        id: `c_${idCounter++}`,
        color,
        type: typeStr,
        value: num,
        score: num,
      });
      cards.push({
        id: `c_${idCounter++}`,
        color,
        type: typeStr,
        value: num,
        score: num,
      });
    }

    // Two of each action per color (Skip, Reverse, Draw Two)
    (['skip', 'reverse', 'draw2'] as CardType[]).forEach((actType) => {
      cards.push({
        id: `c_${idCounter++}`,
        color,
        type: actType,
        score: 20,
      });
      cards.push({
        id: `c_${idCounter++}`,
        color,
        type: actType,
        score: 20,
      });
    });
  });

  // 4 Wild cards
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `c_${idCounter++}`,
      color: 'wild',
      type: 'wild',
      score: 50,
    });
  }

  // 4 Wild Draw Four cards
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `c_${idCounter++}`,
      color: 'wild',
      type: 'wild4',
      score: 50,
    });
  }

  return cards;
};

// Fair Fisher-Yates shuffle
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Check if a card is legally playable given current state
export const isCardPlayable = (
  card: Card,
  activeColor: CardColor,
  topDiscardCard: Card | null,
  pendingDrawPenalty: number,
  stackingRule: boolean
): boolean => {
  if (!topDiscardCard) return true;

  // Stacking penalty active: player MUST counter with a stacking draw card or draw
  if (pendingDrawPenalty > 0) {
    if (!stackingRule) return false;
    if (topDiscardCard.type === 'draw2' && card.type === 'draw2') return true;
    if (card.type === 'wild4') return true;
    return false;
  }

  // Wild cards can always be played
  if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
    return true;
  }

  // Color match
  if (card.color === activeColor) {
    return true;
  }

  // Symbol / number match
  if (card.type === topDiscardCard.type) {
    return true;
  }

  return false;
};

// Calculate next player index given current, direction, step, and total
export const getNextPlayerIndex = (
  currentIndex: number,
  direction: 1 | -1,
  stepCount: number,
  totalPlayers: number
): number => {
  let next = (currentIndex + direction * stepCount) % totalPlayers;
  while (next < 0) {
    next += totalPlayers;
  }
  return next;
};

// Reshuffle draw pile from discard pile if empty
export const replenishDrawPile = (
  drawPile: Card[],
  discardPile: Card[]
): { newDrawPile: Card[]; newDiscardPile: Card[] } => {
  if (drawPile.length > 0) {
    return { newDrawPile: drawPile, newDiscardPile: discardPile };
  }

  if (discardPile.length <= 1) {
    // If not enough cards in discard either, create fresh 108 deck
    const fresh = shuffleDeck(createStandardDeck());
    return { newDrawPile: fresh, newDiscardPile: discardPile };
  }

  const topCard = discardPile[discardPile.length - 1];
  const cardsToRecycle = discardPile.slice(0, discardPile.length - 1);
  const recycledShuffled = shuffleDeck(cardsToRecycle);

  return {
    newDrawPile: recycledShuffled,
    newDiscardPile: [topCard],
  };
};

// Tally points when someone goes out
export const calculateRoundScore = (players: Player[], winnerId: string): number => {
  let totalScore = 0;
  players.forEach((p) => {
    if (p.id !== winnerId) {
      p.hand.forEach((card) => {
        totalScore += card.score;
      });
    }
  });
  return totalScore;
};

// Initial deal state setup
export const startNewRound = (
  currentState: GameTableState,
  rules: GameRules
): {
  deck: Card[];
  tableState: GameTableState;
} => {
  let deck = shuffleDeck(createStandardDeck());
  const players = currentState.players.map((p) => ({
    ...p,
    hand: [] as Card[],
    handCount: 0,
    hasCalledUno: false,
  }));

  // Deal cards to players
  const handSize = rules.startingHandSize || 7;
  for (let i = 0; i < handSize; i++) {
    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      if (deck.length > 0) {
        const card = deck.pop()!;
        players[pIdx].hand.push(card);
        players[pIdx].handCount = players[pIdx].hand.length;
      }
    }
  }

  // Draw initial discard card (must not be Wild Draw Four per standard rules)
  let topCard: Card = deck.pop()!;
  while (topCard.type === 'wild4' || topCard.color === 'wild') {
    deck.unshift(topCard);
    deck = shuffleDeck(deck);
    topCard = deck.pop()!;
  }

  let activeColor = topCard.color;
  let direction: 1 | -1 = 1;
  let currentPlayerIndex = 0;
  let pendingDrawPenalty = 0;
  let lastActionMsg = `Game started! Top card is ${activeColor.toUpperCase()} ${topCard.type.toUpperCase()}`;

  // If first card is Action card:
  if (topCard.type === 'draw2') {
    pendingDrawPenalty = 2;
    lastActionMsg = `Started with Draw Two! Player 1 must counter or draw.`;
  } else if (topCard.type === 'reverse') {
    if (players.length === 2) {
      currentPlayerIndex = 1; // In 2 players, reverse acts like skip
      lastActionMsg = `Started with Reverse! Player 2 goes first.`;
    } else {
      direction = -1;
      currentPlayerIndex = players.length - 1;
      lastActionMsg = `Started with Reverse! Order is counter-clockwise.`;
    }
  } else if (topCard.type === 'skip') {
    currentPlayerIndex = 1;
    lastActionMsg = `Started with Skip! Player 1 is skipped, Player 2 starts.`;
  }

  const newTableState: GameTableState = {
    ...currentState,
    phase: 'PLAYING',
    players,
    currentPlayerIndex,
    direction,
    discardPile: [topCard],
    drawPileCount: deck.length,
    activeColor,
    pendingDrawPenalty,
    unoCallPendingPlayerId: null,
    lastActionMessage: lastActionMsg,
    lastActionType: 'play',
    roundNumber: currentState.roundNumber + 1,
    roundWinnerId: null,
    turnStartTime: Date.now(),
  };

  return { deck, tableState: newTableState };
};
