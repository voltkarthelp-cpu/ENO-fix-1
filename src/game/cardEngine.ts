import {
  Card,
  CardColor,
  CardFace,
  CardType,
  ClassicCardColor,
  DarkCardColor,
  GameRules,
  GameTableState,
  Player,
} from '../types/game';

// Helper: Extract active card face according to current side ('light' vs 'dark')
export const getActiveCardFace = (card: Card, side: 'light' | 'dark' = 'light'): CardFace => {
  if (side === 'dark' && card.darkFace) {
    return card.darkFace;
  }
  return {
    color: card.color,
    type: card.type,
    value: card.value,
    score: card.score,
  };
};

// Helper: Extract reverse card face (shown to opponents in UNO Flip)
export const getReverseCardFace = (card: Card, side: 'light' | 'dark' = 'light'): CardFace => {
  if (side === 'light' && card.darkFace) {
    return card.darkFace;
  }
  return {
    color: card.color,
    type: card.type,
    value: card.value,
    score: card.score,
  };
};

// Card score lookup
export const getCardScore = (type: CardType): number => {
  switch (type) {
    case 'draw10':
      return 100;
    case 'draw6':
      return 60;
    case 'draw5':
    case 'wild_color':
    case 'skip_everyone':
      return 50;
    case 'wild4':
    case 'wild':
      return 50;
    case 'discard_all':
      return 30;
    case 'flip':
    case 'draw2':
    case 'wild2':
    case 'skip':
    case 'reverse':
      return 20;
    case 'draw1':
      return 10;
    default:
      return parseInt(type, 10) || 0;
  }
};

export const getDrawPenaltyAmount = (type: CardType): number => {
  switch (type) {
    case 'draw1': return 1;
    case 'draw2': return 2;
    case 'wild2': return 2;
    case 'wild4': return 4;
    case 'draw5': return 5;
    case 'draw6': return 6;
    case 'draw10': return 10;
    default: return 0;
  }
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

// 1. Generate Classic 108 Card Deck
export const createStandardDeck = (): Card[] => {
  const cards: Card[] = [];
  const colors: ClassicCardColor[] = ['red', 'blue', 'green', 'yellow'];
  let idCounter = 1;

  colors.forEach((color) => {
    // 0
    cards.push({ id: `c_${idCounter++}`, color, type: '0', value: 0, score: 0 });

    // 1-9 (two of each)
    for (let num = 1; num <= 9; num++) {
      const typeStr = num.toString() as CardType;
      cards.push({ id: `c_${idCounter++}`, color, type: typeStr, value: num, score: num });
      cards.push({ id: `c_${idCounter++}`, color, type: typeStr, value: num, score: num });
    }

    // Actions (two of each)
    (['skip', 'reverse', 'draw2'] as CardType[]).forEach((actType) => {
      cards.push({ id: `c_${idCounter++}`, color, type: actType, score: 20 });
      cards.push({ id: `c_${idCounter++}`, color, type: actType, score: 20 });
    });
  });

  // 4 Wild cards
  for (let i = 0; i < 4; i++) {
    cards.push({ id: `c_${idCounter++}`, color: 'wild', type: 'wild', score: 50 });
  }

  // 4 Wild Draw Four cards
  for (let i = 0; i < 4; i++) {
    cards.push({ id: `c_${idCounter++}`, color: 'wild', type: 'wild4', score: 50 });
  }

  return cards;
};

// 2. Generate Full Double-Sided UNO Flip Deck (112 Double-Sided Cards)
export const createFlipDeck = (): Card[] => {
  const cards: Card[] = [];
  const lightColors: ClassicCardColor[] = ['red', 'blue', 'green', 'yellow'];
  const darkColors: DarkCardColor[] = ['pink', 'teal', 'purple', 'orange'];
  let idCounter = 1;

  for (let cIdx = 0; cIdx < 4; cIdx++) {
    const lightColor = lightColors[cIdx];
    const darkColor = darkColors[cIdx];

    // Numbers 1-9 paired with dark side numbers 1-9 (two of each)
    for (let num = 1; num <= 9; num++) {
      const typeStr = num.toString() as CardType;
      // Pair 1
      cards.push({
        id: `flip_${idCounter++}`,
        color: lightColor,
        type: typeStr,
        value: num,
        score: num,
        darkFace: {
          color: darkColor,
          type: typeStr,
          value: num,
          score: num,
        },
      });
      // Pair 2
      cards.push({
        id: `flip_${idCounter++}`,
        color: lightColor,
        type: typeStr,
        value: num,
        score: num,
        darkFace: {
          color: darkColor,
          type: typeStr,
          value: num,
          score: num,
        },
      });
    }

    // Draw One (+1) on Light side paired with Draw Five (+5!) on Dark side
    cards.push({
      id: `flip_${idCounter++}`,
      color: lightColor,
      type: 'draw1',
      score: 10,
      darkFace: { color: darkColor, type: 'draw5', score: 50 },
    });
    cards.push({
      id: `flip_${idCounter++}`,
      color: lightColor,
      type: 'draw1',
      score: 10,
      darkFace: { color: darkColor, type: 'draw5', score: 50 },
    });

    // Skip on Light side paired with Skip Everyone on Dark side
    cards.push({
      id: `flip_${idCounter++}`,
      color: lightColor,
      type: 'skip',
      score: 20,
      darkFace: { color: darkColor, type: 'skip_everyone', score: 50 },
    });
    cards.push({
      id: `flip_${idCounter++}`,
      color: lightColor,
      type: 'skip',
      score: 20,
      darkFace: { color: darkColor, type: 'skip_everyone', score: 50 },
    });

    // Reverse on Light side paired with Reverse on Dark side
    cards.push({
      id: `flip_${idCounter++}`,
      color: lightColor,
      type: 'reverse',
      score: 20,
      darkFace: { color: darkColor, type: 'reverse', score: 20 },
    });
    cards.push({
      id: `flip_${idCounter++}`,
      color: lightColor,
      type: 'reverse',
      score: 20,
      darkFace: { color: darkColor, type: 'reverse', score: 20 },
    });

    // Flip card on Light side paired with Flip card on Dark side
    cards.push({
      id: `flip_${idCounter++}`,
      color: lightColor,
      type: 'flip',
      score: 20,
      darkFace: { color: darkColor, type: 'flip', score: 20 },
    });
    cards.push({
      id: `flip_${idCounter++}`,
      color: lightColor,
      type: 'flip',
      score: 20,
      darkFace: { color: darkColor, type: 'flip', score: 20 },
    });
  }

  // 4 Light Wild cards paired with 4 Dark Wild cards
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `flip_${idCounter++}`,
      color: 'wild',
      type: 'wild',
      score: 40,
      darkFace: {
        color: 'dark_wild',
        type: 'wild',
        score: 40,
      },
    });
  }

  // 4 Light Wild Draw Two cards paired with 4 Dark Wild Draw Color cards!
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `flip_${idCounter++}`,
      color: 'wild',
      type: 'wild2',
      score: 50,
      darkFace: {
        color: 'dark_wild',
        type: 'wild_color',
        score: 60,
      },
    });
  }

  return cards;
};

// 3. Generate UNO Show 'Em No Mercy Deck
export const createNoMercyDeck = (): Card[] => {
  const cards = createStandardDeck();
  const colors: ClassicCardColor[] = ['red', 'blue', 'green', 'yellow'];
  let idCounter = 500;

  colors.forEach((color) => {
    // Draw 6 (+6) per color
    cards.push({
      id: `nm_${idCounter++}`,
      color,
      type: 'draw6',
      score: 60,
    });

    // Discard All of Color (discards all cards of this color in one turn!)
    cards.push({
      id: `nm_${idCounter++}`,
      color,
      type: 'discard_all',
      score: 30,
    });

    // Skip Everyone
    cards.push({
      id: `nm_${idCounter++}`,
      color,
      type: 'skip_everyone',
      score: 50,
    });
  });

  // 4 Wild Draw 10 Cards (+10 cards penalty!)
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `nm_${idCounter++}`,
      color: 'wild',
      type: 'draw10',
      score: 100,
    });
  }

  return cards;
};

// Check if a card is legally playable given current state and side
export const isCardPlayable = (
  card: Card,
  activeColor: CardColor,
  topDiscardCard: Card | null,
  pendingDrawPenalty: number,
  stackingRule: boolean,
  side: 'light' | 'dark' = 'light'
): boolean => {
  const cardFace = getActiveCardFace(card, side);
  if (!topDiscardCard) return true;
  const topFace = getActiveCardFace(topDiscardCard, side);

  const cardPenalty = getDrawPenaltyAmount(cardFace.type);
  const topPenalty = getDrawPenaltyAmount(topFace.type);

  // Stacking penalty active: player MUST counter with a draw card
  if (pendingDrawPenalty > 0) {
    if (!stackingRule) return false;
    // Any penalty card of equal or greater value, or same type can stack
    if (cardPenalty > 0) {
      if (cardPenalty >= topPenalty || cardFace.type === topFace.type) {
        return true;
      }
    }
    return false;
  }

  // Wild cards can always be played
  if (
    cardFace.color === 'wild' ||
    cardFace.color === 'dark_wild' ||
    cardFace.type === 'wild' ||
    cardFace.type === 'wild2' ||
    cardFace.type === 'wild4' ||
    cardFace.type === 'wild_color' ||
    cardFace.type === 'draw10'
  ) {
    return true;
  }

  // Color match
  if (cardFace.color === activeColor) {
    return true;
  }

  // Symbol / number match
  if (cardFace.type === topFace.type) {
    return true;
  }

  // Number value match (e.g. 7 matches 7 even if colors differ)
  if (cardFace.value !== undefined && topFace.value !== undefined && cardFace.value === topFace.value) {
    return true;
  }

  return false;
};

// Calculate next player index given current, direction, step, and total
export const getNextPlayerIndex = (
  currentIndex: number,
  direction: 1 | -1,
  stepCount: number,
  totalPlayers: number,
  eliminatedIds: string[] = [],
  players: Player[] = []
): number => {
  if (totalPlayers <= 0) return 0;
  let next = (currentIndex + direction * stepCount) % totalPlayers;
  while (next < 0) {
    next += totalPlayers;
  }

  // Skip eliminated players if any exist
  if (eliminatedIds.length > 0 && players.length > 0) {
    let attempts = 0;
    while (eliminatedIds.includes(players[next]?.id) && attempts < totalPlayers) {
      next = (next + direction) % totalPlayers;
      while (next < 0) next += totalPlayers;
      attempts++;
    }
  }

  return next;
};

// Reshuffle draw pile from discard pile if empty
export const replenishDrawPile = (
  drawPile: Card[],
  discardPile: Card[],
  deckEdition: GameRules['deckEdition'] = 'flip'
): { newDrawPile: Card[]; newDiscardPile: Card[] } => {
  if (drawPile.length > 0) {
    return { newDrawPile: drawPile, newDiscardPile: discardPile };
  }

  if (discardPile.length <= 1) {
    const fresh = shuffleDeck(
      deckEdition === 'flip'
        ? createFlipDeck()
        : deckEdition === 'no_mercy'
        ? createNoMercyDeck()
        : createStandardDeck()
    );
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
  const edition = rules.deckEdition || 'flip';
  let deck = shuffleDeck(
    edition === 'flip'
      ? createFlipDeck()
      : edition === 'no_mercy'
      ? createNoMercyDeck()
      : createStandardDeck()
  );

  const players = currentState.players.map((p) => ({
    ...p,
    hand: [] as Card[],
    handCount: 0,
    hasCalledUno: false,
    isEliminated: false,
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

  // Draw initial discard card (must not be Wild or Wild Draw / Wild Color per standard rules)
  let topCard: Card = deck.pop()!;
  while (
    topCard.color === 'wild' ||
    topCard.color === 'dark_wild' ||
    topCard.type.startsWith('wild') ||
    topCard.type === 'draw10'
  ) {
    deck.unshift(topCard);
    deck = shuffleDeck(deck);
    topCard = deck.pop()!;
  }

  const currentSide: 'light' | 'dark' = 'light';
  const initialFace = getActiveCardFace(topCard, currentSide);
  let activeColor = initialFace.color;
  let direction: 1 | -1 = 1;
  let currentPlayerIndex = 0;
  let pendingDrawPenalty = 0;
  let lastActionMsg = `Game started with ${edition === 'flip' ? 'UNO FLIP! (Light Side)' : edition === 'no_mercy' ? 'UNO NO MERCY' : 'CLASSIC UNO'}. Top card is ${activeColor.toUpperCase()} ${initialFace.type.toUpperCase()}`;

  // If first card is Action card:
  if (initialFace.type === 'draw1') {
    pendingDrawPenalty = 1;
    lastActionMsg = `Started with Draw One (+1)! First player must counter or draw.`;
  } else if (initialFace.type === 'draw2') {
    pendingDrawPenalty = 2;
    lastActionMsg = `Started with Draw Two! First player must counter or draw.`;
  } else if (initialFace.type === 'draw5') {
    pendingDrawPenalty = 5;
    lastActionMsg = `Started with Draw Five (+5)! First player must counter or draw.`;
  } else if (initialFace.type === 'reverse') {
    if (players.length === 2) {
      currentPlayerIndex = 1;
      lastActionMsg = `Started with Reverse! Player 2 goes first.`;
    } else {
      direction = -1;
      currentPlayerIndex = players.length - 1;
      lastActionMsg = `Started with Reverse! Order is counter-clockwise.`;
    }
  } else if (initialFace.type === 'skip') {
    currentPlayerIndex = 1;
    lastActionMsg = `Started with Skip! Player 1 is skipped, Player 2 starts.`;
  } else if (initialFace.type === 'flip') {
    lastActionMsg = `Started with Flip card! Ready for action!`;
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
    currentSide,
    eliminatedPlayerIds: [],
  };

  return { deck, tableState: newTableState };
};
