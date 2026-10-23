import { Card, CardColor, GameTableState, Player } from '../types/game';
import { isCardPlayable } from './cardEngine';

export interface BotDecision {
  action: 'play' | 'draw';
  card?: Card;
  chosenColor?: CardColor;
  shouldCallUno?: boolean;
}

// Bot selects best card and strategy
export const decideBotMove = (
  botPlayer: Player,
  tableState: GameTableState
): BotDecision => {
  const topDiscard = tableState.discardPile[tableState.discardPile.length - 1];
  const activeColor = tableState.activeColor;
  const pendingPenalty = tableState.pendingDrawPenalty;
  const stackingRule = tableState.rules.stacking;

  const currentSide = tableState.currentSide || 'light';

  // Filter playable cards
  const playableCards = botPlayer.hand.filter((c) =>
    isCardPlayable(c, activeColor, topDiscard, pendingPenalty, stackingRule, currentSide)
  );

  if (playableCards.length === 0) {
    return { action: 'draw' };
  }

  // Count colors in hand to pick best Wild color
  const isDark = currentSide === 'dark';
  const availableColors: CardColor[] = isDark
    ? ['pink', 'teal', 'purple', 'orange']
    : ['red', 'blue', 'green', 'yellow'];

  const colorCounts: Record<string, number> = {};
  availableColors.forEach((col) => {
    colorCounts[col] = 0;
  });

  botPlayer.hand.forEach((c) => {
    const face = c.darkFace && isDark ? c.darkFace : c;
    if (colorCounts[face.color] !== undefined) {
      colorCounts[face.color]++;
    }
  });

  let bestColor: CardColor = availableColors[0];
  let maxCount = -1;
  availableColors.forEach((col) => {
    if ((colorCounts[col] || 0) > maxCount) {
      maxCount = colorCounts[col];
      bestColor = col;
    }
  });

  // Check next player's threat level
  const totalPlayers = tableState.players.length;
  const nextPlayerIndex = (tableState.currentPlayerIndex + tableState.direction + totalPlayers) % totalPlayers;
  const nextPlayer = tableState.players[nextPlayerIndex];
  const nextPlayerDangerous = nextPlayer.hand.length <= 2;

  let chosenCard: Card;

  if (nextPlayerDangerous) {
    // Try to attack next player with Action cards
    const attackCard = playableCards.find(
      (c) => c.type === 'wild4' || c.type === 'draw2' || c.type === 'skip' || c.type === 'reverse'
    );
    chosenCard = attackCard || playableCards[0];
  } else {
    // Prefer matching standard color cards over spending Wilds
    const nonWild = playableCards.find((c) => c.color !== 'wild');
    if (nonWild) {
      chosenCard = nonWild;
    } else {
      chosenCard = playableCards[0];
    }
  }

  // Determine if bot calls UNO (85% success, 15% slip-up)
  const willHaveOneCard = botPlayer.hand.length === 2;
  const shouldCallUno = willHaveOneCard ? Math.random() < 0.88 : false;

  return {
    action: 'play',
    card: chosenCard,
    chosenColor: chosenCard.color === 'wild' || chosenCard.type === 'wild' || chosenCard.type === 'wild4' ? bestColor : undefined,
    shouldCallUno,
  };
};
