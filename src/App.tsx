import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TitleScreen } from './components/screens/TitleScreen';
import { HostSetupScreen } from './components/screens/HostSetupScreen';
import { JoinScreen } from './components/screens/JoinScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { GameTable } from './components/screens/GameTable';
import { RulesModal } from './components/screens/RulesModal';
import { DiagnosticsModal } from './components/screens/DiagnosticsModal';
import { SupabaseSettingsModal } from './components/screens/SupabaseSettingsModal';
import { AvatarId, Card, CardColor, GameMode, GamePhase, GameRules, GameTableState, Player } from './types/game';
import {
  calculateRoundScore,
  getActiveCardFace,
  getNextPlayerIndex,
  getReverseCardFace,
  isCardPlayable,
  replenishDrawPile,
  startNewRound,
} from './game/cardEngine';
import { networkSync, NetworkMessage } from './game/networkSync';
import { soundFx } from './sound/soundFx';

const MODERN_AVATARS: AvatarId[] = [
  'dragon',
  'phoenix',
  'tiger',
  'wolf',
  'falcon',
  'bear',
  'fox',
  'viper',
];

export default function App() {
  const initialRoomFromUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('room')
    : null;

  // Screen and Mode States
  const [phase, setPhase] = useState<GamePhase>(initialRoomFromUrl ? 'JOIN' : 'TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('multiplayer');
  const [localPlayerId, setLocalPlayerId] = useState<string>(
    initialRoomFromUrl ? 'p_peer_' + Math.random().toString(36).slice(2, 7) : 'p_host'
  );
  const [isHost, setIsHost] = useState(!initialRoomFromUrl);

  // Modern Audio Controls
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);

  // Modals
  const [showRules, setShowRules] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false);
  const [showPassAndPlayPicker, setShowPassAndPlayPicker] = useState(false);

  // Pass & Play interstitial
  const [passAndPlayWaiting, setPassAndPlayWaiting] = useState(false);

  // Default game rules: Up to 8 players, bot-free
  const [rules, setRules] = useState<GameRules>({
    deckEdition: 'flip',
    playerLimit: 8,
    startingHandSize: 7,
    targetScore: 250,
    stacking: true,
    drawUntilPlayable: false,
    unoPenaltyCards: 2,
    turnTimeoutSeconds: 0,
    mercyRule: false,
    sevenZeroRule: false,
  });

  // Authoritative full deck (kept by host or local session)
  const fullDeckRef = useRef<Card[]>([]);

  // Authoritative Game Table State
  const [tableState, setTableState] = useState<GameTableState>(() => {
    const code = initialRoomFromUrl ? initialRoomFromUrl.toUpperCase() : networkSync.generateRoomCode();
    return {
      roomCode: code,
      hostId: 'p_host',
      phase: initialRoomFromUrl ? 'JOIN' : 'TITLE',
      mode: 'multiplayer',
      rules: {
        deckEdition: 'flip',
        playerLimit: 8,
        startingHandSize: 7,
        targetScore: 250,
        stacking: true,
        drawUntilPlayable: false,
        unoPenaltyCards: 2,
        turnTimeoutSeconds: 0,
        mercyRule: false,
        sevenZeroRule: false,
      },
      players: [],
      currentPlayerIndex: 0,
      direction: 1,
      discardPile: [],
      drawPileCount: 0,
      activeColor: 'red',
      pendingDrawPenalty: 0,
      unoCallPendingPlayerId: null,
      lastActionMessage: 'Welcome to Card Clash: UNO Flip Edition!',
      roundNumber: 0,
      roundWinnerId: null,
      matchWinnerId: null,
      turnStartTime: Date.now(),
      currentSide: 'light',
      eliminatedPlayerIds: [],
    };
  });

  // Keep fresh references for network event handlers to avoid stale closures
  const tableStateRef = useRef<GameTableState>(tableState);
  tableStateRef.current = tableState;

  const isHostRef = useRef<boolean>(isHost);
  isHostRef.current = isHost;

  const localPlayerIdRef = useRef<string>(localPlayerId);
  localPlayerIdRef.current = localPlayerId;

  // Draw Card Helper (with clean discard pile recycling to prevent card duplication)
  const drawCardsFromDeck = useCallback((count: number): { drawn: Card[]; newDiscardPile?: Card[] } => {
    let deck = fullDeckRef.current;
    let currentDiscard = tableStateRef.current.discardPile;
    let updatedDiscard: Card[] | undefined;
    const drawn: Card[] = [];

    for (let i = 0; i < count; i++) {
      if (deck.length === 0) {
        const replenished = replenishDrawPile([], currentDiscard);
        deck = replenished.newDrawPile;
        currentDiscard = replenished.newDiscardPile;
        updatedDiscard = currentDiscard;
      }
      if (deck.length > 0) {
        drawn.push(deck.pop()!);
      }
    }

    fullDeckRef.current = deck;
    return { drawn, newDiscardPile: updatedDiscard };
  }, []);

  // --- AUTHORITATIVE ACTION EXECUTORS ---

  // 1. Play Card (Host only)
  const executePlayCard = useCallback(
    (playerId: string, cardId: string, chosenColor?: CardColor, calledUno?: boolean) => {
      const prev = tableStateRef.current;
      const playerIndex = prev.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return;

      // Strict authoritative turn verification
      if (playerIndex !== prev.currentPlayerIndex) {
        console.warn(`[Fairness Guard] Ignored move from ${playerId}: it is Player #${prev.currentPlayerIndex + 1}'s turn.`);
        return;
      }

      const player = prev.players[playerIndex];
      const card = player.hand.find((c) => c.id === cardId);
      if (!card) return;

      const currentSide = prev.currentSide || 'light';
      const cardFace = getActiveCardFace(card, currentSide);
      const topDiscard = prev.discardPile[prev.discardPile.length - 1] || null;

      if (!isCardPlayable(card, prev.activeColor, topDiscard, prev.pendingDrawPenalty, prev.rules.stacking, currentSide, player.hand)) {
        console.warn(`[Fairness Guard] Illegal card play rejected:`, card);
        return;
      }

      // Remove played card from hand
      let newHand = player.hand.filter((c) => c.id !== cardId);

      // Special action: Discard All of Color (No Mercy)
      if (cardFace.type === 'discard_all') {
        newHand = newHand.filter((c) => getActiveCardFace(c, currentSide).color !== cardFace.color);
      }

      // Check Uno status
      let hasCalledUno = player.hasCalledUno;
      let pendingUnoPlayerId = prev.unoCallPendingPlayerId;

      if (newHand.length === 1) {
        if (calledUno) {
          hasCalledUno = true;
          pendingUnoPlayerId = null;
        } else {
          hasCalledUno = false;
          pendingUnoPlayerId = player.id;
        }
      } else {
        hasCalledUno = false;
        // If player didn't have 1 card and previous player wasn't caught, the window expires
        pendingUnoPlayerId = null;
      }

      const updatedPlayer: Player = {
        ...player,
        hand: newHand,
        handCount: newHand.length,
        hasCalledUno,
      };

      const updatedPlayers = [...prev.players];
      updatedPlayers[playerIndex] = updatedPlayer;

      // Check for round win (empty hand!)
      if (newHand.length === 0) {
        soundFx.playRoundWin();
        const roundPoints = calculateRoundScore(updatedPlayers, player.id);
        const newScore = player.score + roundPoints;
        updatedPlayers[playerIndex] = { ...updatedPlayer, score: newScore };

        const isMatchWon = newScore >= prev.rules.targetScore;

        const roundEndState: GameTableState = {
          ...prev,
          phase: 'ROUND_END',
          players: updatedPlayers,
          discardPile: [...prev.discardPile, card],
          roundWinnerId: player.id,
          matchWinnerId: isMatchWon ? player.id : null,
          lastActionMessage: `🏆 ${player.name} emptied their hand and scored +${roundPoints} points!`,
          lastActionType: 'play',
        };

        setTableState(roundEndState);
        if (isHostRef.current) {
          networkSync.broadcast({
            type: 'TABLE_SYNC',
            roomCode: prev.roomCode,
            tableState: roundEndState,
          });
        }
        return;
      }

      // Audio feedback
      if (calledUno) {
        soundFx.playUnoCall();
      } else if (cardFace.type === 'flip') {
        soundFx.playFlip();
      } else if (
        cardFace.color === 'wild' ||
        cardFace.color === 'dark_wild' ||
        cardFace.type === 'wild' ||
        cardFace.type === 'wild2' ||
        cardFace.type === 'wild4' ||
        cardFace.type === 'wild_color'
      ) {
        soundFx.playWild();
      } else if (
        cardFace.type === 'draw1' ||
        cardFace.type === 'draw2' ||
        cardFace.type === 'draw5' ||
        cardFace.type === 'draw6' ||
        cardFace.type === 'draw10'
      ) {
        soundFx.playDrawPenalty();
      } else if (cardFace.type === 'skip' || cardFace.type === 'skip_everyone') {
        soundFx.playSkip();
      } else if (cardFace.type === 'reverse') {
        soundFx.playReverse();
      } else {
        soundFx.playCardPlay();
      }

      // Handle card effects and rotation
      let newDirection = prev.direction;
      let nextStep = 1;
      let newSide: 'light' | 'dark' = currentSide;
      let newActiveColor: CardColor =
        (cardFace.color === 'wild' || cardFace.color === 'dark_wild') && chosenColor
          ? chosenColor
          : cardFace.color;
      let pendingPenalty = prev.pendingDrawPenalty;
      let actionType: GameTableState['lastActionType'] = 'play';
      let actionMsg = `${player.name} played ${cardFace.color.toUpperCase()} ${cardFace.type.toUpperCase()}`;

      // 1. FLIP Card (UNO Flip!)
      if (cardFace.type === 'flip') {
        newSide = currentSide === 'light' ? 'dark' : 'light';
        soundFx.speakFlip(newSide);
        actionType = 'flip';
        const reverseFace = getActiveCardFace(card, newSide);
        newActiveColor =
          reverseFace.color === 'wild' || reverseFace.color === 'dark_wild'
            ? (chosenColor || (newSide === 'dark' ? 'pink' : 'red'))
            : reverseFace.color;
        actionMsg = `↻ ${player.name} played FLIP! Entering the ${newSide === 'dark' ? 'DARK SIDE 🌌' : 'LIGHT SIDE ☀️'}!`;
      }
      // 2. Skip Everyone (UNO Flip Dark Side & No Mercy)
      else if (cardFace.type === 'skip_everyone') {
        nextStep = 0; // Current player plays again immediately!
        actionType = 'skip';
        soundFx.speakSkipEveryone();
        actionMsg = `⊗ ${player.name} played SKIP EVERYONE! All opponents skipped, ${player.name} plays again!`;
      }
      // 3. Skip
      else if (cardFace.type === 'skip') {
        nextStep = 2;
        actionType = 'skip';
        actionMsg = `⊘ ${player.name} played Skip! Next player skipped.`;
      }
      // 4. Reverse
      else if (cardFace.type === 'reverse') {
        actionType = 'reverse';
        if (prev.players.length === 2) {
          nextStep = 2; // Acts as Skip in 2-player UNO
          actionMsg = `⇄ ${player.name} played Reverse (Acts as Skip in 2P)!`;
        } else {
          newDirection = (prev.direction * -1) as 1 | -1;
          nextStep = 1;
          actionMsg = `⇄ ${player.name} reversed play order!`;
        }
      }
      // 5. Draw 1 (UNO Flip Light Side)
      else if (cardFace.type === 'draw1') {
        actionType = 'penalty';
        pendingPenalty += 1;
        actionMsg = `+1 ${player.name} played Draw One! (Stack: +${pendingPenalty})`;
      }
      // 6. Draw 2
      else if (cardFace.type === 'draw2') {
        actionType = 'penalty';
        pendingPenalty += 2;
        actionMsg = `+2 ${player.name} played Draw Two! (Stack: +${pendingPenalty})`;
      }
      // 7. Draw 5 (UNO Flip Dark Side)
      else if (cardFace.type === 'draw5') {
        actionType = 'penalty';
        pendingPenalty += 5;
        actionMsg = `+5 ${player.name} unleashed Dark Draw Five! (Stack: +${pendingPenalty})`;
      }
      // 8. Draw 6 (No Mercy)
      else if (cardFace.type === 'draw6') {
        actionType = 'penalty';
        pendingPenalty += 6;
        actionMsg = `+6 ${player.name} played Draw Six! (Stack: +${pendingPenalty})`;
      }
      // 9. Draw 10 (No Mercy)
      else if (cardFace.type === 'draw10') {
        actionType = 'penalty';
        pendingPenalty += 10;
        newActiveColor = chosenColor || 'red';
        actionMsg = `☠+10 ${player.name} unleashed WILD DRAW 10! (Stack: +${pendingPenalty})`;
      }
      // 10. Wild / Wild 2 / Wild 4 / Wild Color
      else if (
        cardFace.type === 'wild' ||
        cardFace.type === 'wild2' ||
        cardFace.type === 'wild4' ||
        cardFace.type === 'wild_color'
      ) {
        actionType = 'wild';
        newActiveColor = chosenColor || (currentSide === 'dark' ? 'pink' : 'red');
        if (cardFace.type === 'wild2') {
          pendingPenalty += 2;
          actionMsg = `★+2 ${player.name} played Wild Draw 2 to ${newActiveColor.toUpperCase()}! (Stack: +${pendingPenalty})`;
        } else if (cardFace.type === 'wild4') {
          pendingPenalty += 4;
          actionMsg = `★+4 ${player.name} played Wild Draw 4 to ${newActiveColor.toUpperCase()}! (Stack: +${pendingPenalty})`;
        } else if (cardFace.type === 'wild_color') {
          pendingPenalty += 4;
          actionMsg = `❖ ${player.name} played Wild Draw Color to ${newActiveColor.toUpperCase()}! (Stack: +${pendingPenalty})`;
        } else {
          actionMsg = `★ ${player.name} changed color to ${newActiveColor.toUpperCase()}!`;
        }
      }
      // 11. Discard All (No Mercy)
      else if (cardFace.type === 'discard_all') {
        actionType = 'play';
        actionMsg = `⇊ ${player.name} played Discard All ${cardFace.color.toUpperCase()}!`;
      }

      if (calledUno) {
        actionMsg += ` 🚨 ${player.name} called UNO!`;
        actionType = 'uno';
      }

      // Check Mercy Knockout for player if hands >= 25
      let eliminatedIds = [...(prev.eliminatedPlayerIds || [])];
      if (prev.rules.mercyRule && updatedPlayer.hand.length >= 25) {
        updatedPlayer.isEliminated = true;
        if (!eliminatedIds.includes(player.id)) {
          eliminatedIds.push(player.id);
        }
        soundFx.speakMercyEliminated(player.name);
        actionMsg += ` ☠ MERCY RULE: ${player.name} holds ${updatedPlayer.hand.length} cards and is eliminated!`;
      }

      const nextPlayerIndex = getNextPlayerIndex(
        prev.currentPlayerIndex,
        newDirection,
        nextStep,
        prev.players.length,
        eliminatedIds,
        updatedPlayers
      );

      const nextTableState: GameTableState = {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        direction: newDirection,
        discardPile: [...prev.discardPile, card],
        activeColor: newActiveColor,
        pendingDrawPenalty: pendingPenalty,
        unoCallPendingPlayerId: pendingUnoPlayerId,
        lastActionMessage: actionMsg,
        lastActionType: actionType,
        turnStartTime: Date.now(),
        currentSide: newSide,
        eliminatedPlayerIds: eliminatedIds,
      };

      // Pass & Play handoff
      if (prev.mode === 'pass_and_play') {
        setLocalPlayerId(updatedPlayers[nextPlayerIndex].id);
        setPassAndPlayWaiting(true);
      }

      setTableState(nextTableState);

      if (isHostRef.current) {
        networkSync.broadcast({
          type: 'TABLE_SYNC',
          roomCode: prev.roomCode,
          tableState: nextTableState,
        });
      }
    },
    [drawCardsFromDeck]
  );

  // 2. Draw Card (Host only)
  const executeDrawCard = useCallback(
    (playerId: string) => {
      const prev = tableStateRef.current;
      const playerIndex = prev.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return;

      if (playerIndex !== prev.currentPlayerIndex) {
        console.warn(`[Fairness Guard] Ignored draw from ${playerId}: it is not their turn.`);
        return;
      }

      const player = prev.players[playerIndex];
      const countToDraw = prev.pendingDrawPenalty > 0 ? prev.pendingDrawPenalty : 1;

      if (prev.pendingDrawPenalty > 0) {
        soundFx.playDrawPenalty();
      } else {
        soundFx.playCardDraw();
      }

      const { drawn: drawnCards, newDiscardPile } = drawCardsFromDeck(countToDraw);

      const updatedPlayer: Player = {
        ...player,
        hand: [...player.hand, ...drawnCards],
        handCount: player.hand.length + drawnCards.length,
        hasCalledUno: false,
      };

      const updatedPlayers = [...prev.players];
      updatedPlayers[playerIndex] = updatedPlayer;

      let actionMsg =
        prev.pendingDrawPenalty > 0
          ? `${player.name} drew +${prev.pendingDrawPenalty} stacked cards!`
          : `${player.name} drew a card.`;
      let actionType: GameTableState['lastActionType'] = 'draw';

      let eliminatedIds = [...(prev.eliminatedPlayerIds || [])];
      if (prev.rules.mercyRule && updatedPlayer.hand.length >= 25 && !updatedPlayer.isEliminated) {
        updatedPlayer.isEliminated = true;
        if (!eliminatedIds.includes(player.id)) {
          eliminatedIds.push(player.id);
        }
        soundFx.speakMercyEliminated(player.name);
        actionMsg += ` ☠ MERCY RULE: ${player.name} holds ${updatedPlayer.hand.length} cards and is eliminated!`;
        actionType = 'mercy';
      }

      const nextIndex = getNextPlayerIndex(
        prev.currentPlayerIndex,
        prev.direction,
        1,
        prev.players.length,
        eliminatedIds,
        updatedPlayers
      );

      const nextTableState: GameTableState = {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        discardPile: newDiscardPile || prev.discardPile,
        drawPileCount: fullDeckRef.current.length,
        pendingDrawPenalty: 0,
        unoCallPendingPlayerId: null, // Window to catch previous player has closed
        lastActionMessage: actionMsg,
        lastActionType: actionType,
        turnStartTime: Date.now(),
        currentSide: prev.currentSide || 'light',
        eliminatedPlayerIds: eliminatedIds,
      };

      if (prev.mode === 'pass_and_play') {
        setLocalPlayerId(updatedPlayers[nextIndex].id);
        setPassAndPlayWaiting(true);
      }

      setTableState(nextTableState);

      if (isHostRef.current) {
        networkSync.broadcast({
          type: 'TABLE_SYNC',
          roomCode: prev.roomCode,
          tableState: nextTableState,
        });
      }
    },
    [drawCardsFromDeck]
  );

  // 3. Call UNO
  const executeCallUno = useCallback((playerId: string) => {
    soundFx.playUnoCall();
    const prev = tableStateRef.current;
    const updated = prev.players.map((p) =>
      p.id === playerId ? { ...p, hasCalledUno: true } : p
    );
    const isPending = prev.unoCallPendingPlayerId === playerId;
    const nextState: GameTableState = {
      ...prev,
      players: updated,
      unoCallPendingPlayerId: isPending ? null : prev.unoCallPendingPlayerId,
      lastActionMessage: `🚨 ${prev.players.find((p) => p.id === playerId)?.name} called UNO!`,
      lastActionType: 'uno',
    };

    setTableState(nextState);

    if (isHostRef.current) {
      networkSync.broadcast({
        type: 'TABLE_SYNC',
        roomCode: prev.roomCode,
        tableState: nextState,
      });
    }
  }, []);

  // 4. Catch UNO
  const executeCatchUno = useCallback(
    (catcherId: string, targetPlayerId: string) => {
      const prev = tableStateRef.current;
      if (prev.unoCallPendingPlayerId !== targetPlayerId) {
        return;
      }

      soundFx.playUnoCaught();
      const targetIndex = prev.players.findIndex((p) => p.id === targetPlayerId);
      if (targetIndex === -1) return;

      const target = prev.players[targetIndex];
      const catcher = prev.players.find((p) => p.id === catcherId);

      const penaltyCount = prev.rules.unoPenaltyCards || 2;
      const { drawn: penaltyCards, newDiscardPile } = drawCardsFromDeck(penaltyCount);

      const updatedTarget: Player = {
        ...target,
        hand: [...target.hand, ...penaltyCards],
        handCount: target.hand.length + penaltyCards.length,
        hasCalledUno: false,
      };

      const updatedPlayers = [...prev.players];
      updatedPlayers[targetIndex] = updatedTarget;

      const nextState: GameTableState = {
        ...prev,
        players: updatedPlayers,
        unoCallPendingPlayerId: null,
        discardPile: newDiscardPile || prev.discardPile,
        drawPileCount: fullDeckRef.current.length,
        lastActionMessage: `🚨 ${catcher?.name || 'Someone'} caught ${target.name} not calling UNO! +${penaltyCount} penalty cards!`,
        lastActionType: 'penalty',
      };

      setTableState(nextState);

      if (isHostRef.current) {
        networkSync.broadcast({
          type: 'TABLE_SYNC',
          roomCode: prev.roomCode,
          tableState: nextState,
        });
      }
    },
    [drawCardsFromDeck]
  );

  // 5. AFK Skip Player Turn (triggered after 20s of inactivity)
  const executeAfkSkip = useCallback(
    (playerId: string) => {
      const prev = tableStateRef.current;
      if (prev.phase !== 'PLAYING') return;
      const playerIndex = prev.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1 || playerIndex !== prev.currentPlayerIndex) return;

      const player = prev.players[playerIndex];
      soundFx.playSkip();
      soundFx.speak(`Player ${player.name} AFK. Turn skipped!`);

      // Penalty draw for AFK: if stacking penalty active, draw that pool; otherwise draw 1 card
      const countToDraw = prev.pendingDrawPenalty > 0 ? prev.pendingDrawPenalty : 1;
      const { drawn: penaltyCards, newDiscardPile } = drawCardsFromDeck(countToDraw);

      const updatedPlayer: Player = {
        ...player,
        hand: [...player.hand, ...penaltyCards],
        handCount: player.hand.length + penaltyCards.length,
        hasCalledUno: false,
      };

      const updatedPlayers = [...prev.players];
      updatedPlayers[playerIndex] = updatedPlayer;

      let actionMsg = `⏱️ ${player.name} went AFK (20s)! Drew ${countToDraw} card${countToDraw > 1 ? 's' : ''} & turn skipped.`;
      let eliminatedIds = [...(prev.eliminatedPlayerIds || [])];

      if (prev.rules.mercyRule && updatedPlayer.hand.length >= 25 && !updatedPlayer.isEliminated) {
        updatedPlayer.isEliminated = true;
        if (!eliminatedIds.includes(player.id)) eliminatedIds.push(player.id);
        soundFx.speakMercyEliminated(player.name);
        actionMsg += ` ☠ MERCY RULE: Knocked out!`;
      }

      const nextIndex = getNextPlayerIndex(
        prev.currentPlayerIndex,
        prev.direction,
        1,
        prev.players.length,
        eliminatedIds,
        updatedPlayers
      );

      const nextTableState: GameTableState = {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
        discardPile: newDiscardPile || prev.discardPile,
        drawPileCount: fullDeckRef.current.length,
        pendingDrawPenalty: 0,
        unoCallPendingPlayerId: null,
        lastActionMessage: actionMsg,
        lastActionType: 'skip',
        turnStartTime: Date.now(),
        currentSide: prev.currentSide || 'light',
        eliminatedPlayerIds: eliminatedIds,
      };

      if (prev.mode === 'pass_and_play') {
        setLocalPlayerId(updatedPlayers[nextIndex].id);
        setPassAndPlayWaiting(true);
      }

      setTableState(nextTableState);

      if (isHostRef.current) {
        networkSync.broadcast({
          type: 'TABLE_SYNC',
          roomCode: prev.roomCode,
          tableState: nextTableState,
        });
      }
    },
    [drawCardsFromDeck]
  );

  // Authoritative 20-second AFK Player Turn Timer (Host-managed)
  useEffect(() => {
    if (!isHost || tableState.phase !== 'PLAYING') return;

    const interval = setInterval(() => {
      const current = tableStateRef.current;
      if (current.phase !== 'PLAYING') return;

      const activePlayer = current.players[current.currentPlayerIndex];
      if (!activePlayer || activePlayer.isEliminated) return;

      const elapsed = Date.now() - (current.turnStartTime || Date.now());
      if (elapsed >= 20000) {
        // Player is AFK! Skip turn
        executeAfkSkip(activePlayer.id);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isHost, tableState.phase, executeAfkSkip]);

  // Auto-reset lastActionType to 'play' after 1.4s to prevent sticky action overlays
  useEffect(() => {
    if (
      tableState.lastActionType &&
      tableState.lastActionType !== 'play' &&
      tableState.lastActionType !== 'draw'
    ) {
      const timer = setTimeout(() => {
        setTableState((prev) => ({
          ...prev,
          lastActionType: 'play',
        }));
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [tableState.lastActionType, tableState.lastActionMessage]);

  // Subscribe to real-time events across Supabase, SSE, and local tabs
  useEffect(() => {
    const unsubscribe = networkSync.subscribe((msg: NetworkMessage) => {
      const currentRoom = tableStateRef.current.roomCode;
      if (msg.roomCode && msg.roomCode.toUpperCase() !== currentRoom.toUpperCase()) {
        return;
      }

      if (msg.type === 'JOIN_REQUEST' && isHostRef.current) {
        const prev = tableStateRef.current;
        if (prev.players.length >= prev.rules.playerLimit) return;
        if (prev.players.some((p) => p.id === msg.player.id)) return;

        const updatedPlayers = [...prev.players, msg.player];
        const nextState = { ...prev, players: updatedPlayers };
        setTableState(nextState);

        networkSync.broadcast({
          type: 'LOBBY_UPDATE',
          roomCode: prev.roomCode,
          players: updatedPlayers,
          hostId: prev.hostId,
        });

        // If game is in progress, also sync live state
        if (prev.phase === 'PLAYING' || prev.phase === 'ROUND_END') {
          networkSync.broadcast({
            type: 'TABLE_SYNC',
            roomCode: prev.roomCode,
            tableState: nextState,
          });
        }
      } else if (msg.type === 'LOBBY_UPDATE') {
        const prev = tableStateRef.current;
        if (prev.phase === 'PLAYING') return;
        setTableState((old) => ({
          ...old,
          players: msg.players,
          hostId: msg.hostId || old.hostId,
        }));
      } else if (msg.type === 'GAME_STARTED' && !isHostRef.current) {
        setTableState(msg.tableState);
        setPhase('PLAYING');
      } else if (msg.type === 'TABLE_SYNC') {
        if (!isHostRef.current) {
          setTableState(msg.tableState);
          if (msg.tableState.phase === 'PLAYING' || msg.tableState.phase === 'ROUND_END') {
            setPhase('PLAYING');
          }
        }
      } else if (msg.type === 'ACTION_PLAY' && isHostRef.current) {
        executePlayCard(msg.playerId, msg.cardId, msg.chosenColor, msg.calledUno);
      } else if (msg.type === 'ACTION_DRAW' && isHostRef.current) {
        executeDrawCard(msg.playerId);
      } else if (msg.type === 'ACTION_CALL_UNO' && isHostRef.current) {
        executeCallUno(msg.playerId);
      } else if (msg.type === 'ACTION_CATCH_UNO' && isHostRef.current) {
        executeCatchUno(msg.catcherId, msg.targetPlayerId);
      }
    });

    return unsubscribe;
  }, [executePlayCard, executeDrawCard, executeCallUno, executeCatchUno]);

  // Audio toggles
  const handleToggleMusic = () => {
    const isNowMuted = soundFx.toggleMusic();
    setMusicMuted(isNowMuted);
  };

  const handleToggleSfx = () => {
    const isNowMuted = soundFx.toggleSfx();
    setSfxMuted(isNowMuted);
  };

  // --- GAME START HANDLERS ---

  // 1. Pass & Play Start (2 to 8 human players on one phone or tablet)
  const handleStartPassAndPlay = (playerCount: number = 4) => {
    const initialPlayers: Player[] = Array.from({ length: playerCount }).map((_, idx) => ({
      id: `p_human_${idx + 1}`,
      name: `Player ${idx + 1}`,
      avatar: MODERN_AVATARS[idx % MODERN_AVATARS.length],
      isBot: false,
      hand: [],
      handCount: 0,
      score: 0,
      isHost: idx === 0,
      hasCalledUno: false,
      isReady: true,
      isConnected: true,
    }));

    setLocalPlayerId(initialPlayers[0].id);
    setIsHost(true);
    setGameMode('pass_and_play');

    const freshRules = { ...rules, playerLimit: playerCount };
    setRules(freshRules);

    const freshState: GameTableState = {
      ...tableState,
      roomCode: networkSync.generateRoomCode(),
      hostId: initialPlayers[0].id,
      mode: 'pass_and_play',
      rules: freshRules,
      players: initialPlayers,
      roundNumber: 0,
    };

    const { deck, tableState: dealtState } = startNewRound(freshState, freshRules);
    fullDeckRef.current = deck;
    setTableState(dealtState);
    setPhase('PLAYING');
    setShowPassAndPlayPicker(false);
  };

  // 2. Start Host Setup (generates fresh room code and syncs URL)
  const handleStartHost = () => {
    const freshCode = networkSync.generateRoomCode();
    setTableState((prev) => ({ ...prev, roomCode: freshCode }));
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '?room=' + freshCode);
    }
    setPhase('HOST_SETUP');
  };

  // 3. Confirm Host Screen
  const handleConfirmHost = (
    hostName: string,
    avatar: AvatarId,
    newRules: GameRules,
    code: string
  ) => {
    const finalCode = code.toUpperCase();
    setRules(newRules);
    const hostPlayer: Player = {
      id: 'p_host_' + Date.now().toString(36),
      name: hostName,
      avatar,
      isBot: false,
      hand: [],
      handCount: 0,
      score: 0,
      isHost: true,
      hasCalledUno: false,
      isReady: true,
      isConnected: true,
    };

    setLocalPlayerId(hostPlayer.id);
    setIsHost(true);
    setGameMode('multiplayer');

    const nextState: GameTableState = {
      ...tableState,
      roomCode: finalCode,
      hostId: hostPlayer.id,
      rules: newRules,
      players: [hostPlayer],
      phase: 'LOBBY',
    };
    setTableState(nextState);

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '?room=' + finalCode);
    }

    // Start background sync for multi-device & Wi-Fi peers
    networkSync.startServerSync(finalCode, true);

    // Broadcast host registration
    networkSync.broadcast({
      type: 'JOIN_REQUEST',
      roomCode: finalCode,
      player: hostPlayer,
    });

    setPhase('LOBBY');
  };

  // 4. Confirm Join Screen
  const handleConfirmJoin = (name: string, avatar: AvatarId, code: string) => {
    const finalCode = code.toUpperCase();
    const peerPlayer: Player = {
      id: 'p_client_' + Date.now().toString(36),
      name,
      avatar,
      isBot: false,
      hand: [],
      handCount: 0,
      score: 0,
      isHost: false,
      hasCalledUno: false,
      isReady: true,
      isConnected: true,
    };

    setLocalPlayerId(peerPlayer.id);
    setIsHost(false);
    setGameMode('multiplayer');

    setTableState((prev) => ({
      ...prev,
      roomCode: finalCode,
      players: [peerPlayer],
    }));

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '?room=' + finalCode);
    }

    // Start background sync for client
    networkSync.startServerSync(finalCode, false);

    // Broadcast join request to host
    networkSync.broadcast({
      type: 'JOIN_REQUEST',
      roomCode: finalCode,
      player: peerPlayer,
    });

    setPhase('LOBBY');
  };

  const handleLeaveRoom = () => {
    if (tableState.roomCode && localPlayerId) {
      networkSync.leaveRoom(tableState.roomCode, localPlayerId);
    }
    networkSync.stopServerSync();
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setPhase('TITLE');
  };

  // Lobby: Remove Player (Host only)
  const handleRemovePlayer = (id: string) => {
    if (!isHost) return;
    const prev = tableStateRef.current;
    const updated = prev.players.filter((p) => p.id !== id);
    setTableState({ ...prev, players: updated });

    networkSync.broadcast({
      type: 'LOBBY_UPDATE',
      roomCode: prev.roomCode,
      players: updated,
      hostId: prev.hostId,
    });
  };

  // Host: Start Match from Lobby
  const handleHostStartGame = () => {
    if (!isHost || tableState.players.length < 2) return;
    const { deck, tableState: dealtState } = startNewRound(tableState, rules);
    fullDeckRef.current = deck;
    setTableState(dealtState);
    setPhase('PLAYING');

    // Broadcast started state
    networkSync.broadcast({
      type: 'GAME_STARTED',
      roomCode: tableState.roomCode,
      tableState: dealtState,
    });
  };

  // Client Action Dispatchers
  const handleClientPlayCard = (
    cardId: string,
    chosenColor?: CardColor,
    calledUno?: boolean
  ) => {
    if (isHost) {
      executePlayCard(localPlayerId, cardId, chosenColor, calledUno);
    } else {
      networkSync.broadcast({
        type: 'ACTION_PLAY',
        roomCode: tableState.roomCode,
        playerId: localPlayerId,
        cardId,
        chosenColor,
        calledUno,
      });
    }
  };

  const handleClientDrawCard = () => {
    if (isHost) {
      executeDrawCard(localPlayerId);
    } else {
      networkSync.broadcast({
        type: 'ACTION_DRAW',
        roomCode: tableState.roomCode,
        playerId: localPlayerId,
      });
    }
  };

  const handleClientCallUno = () => {
    if (isHost) {
      executeCallUno(localPlayerId);
    } else {
      networkSync.broadcast({
        type: 'ACTION_CALL_UNO',
        roomCode: tableState.roomCode,
        playerId: localPlayerId,
      });
    }
  };

  const handleClientCatchUno = (targetId: string) => {
    if (isHost) {
      executeCatchUno(localPlayerId, targetId);
    } else {
      networkSync.broadcast({
        type: 'ACTION_CATCH_UNO',
        roomCode: tableState.roomCode,
        catcherId: localPlayerId,
        targetPlayerId: targetId,
      });
    }
  };

  // Next round dealer
  const handleNextRound = () => {
    if (!isHost) return;
    const { deck, tableState: dealtState } = startNewRound(tableState, rules);
    fullDeckRef.current = deck;
    setTableState(dealtState);

    networkSync.broadcast({
      type: 'TABLE_SYNC',
      roomCode: tableState.roomCode,
      tableState: dealtState,
    });
  };

  // Restart match from beginning
  const handleRestartMatch = () => {
    if (!isHost) return;
    const resetPlayers = tableState.players.map((p) => ({
      ...p,
      score: 0,
      hand: [],
      handCount: 0,
    }));
    const freshState: GameTableState = {
      ...tableState,
      players: resetPlayers,
      roundNumber: 0,
      matchWinnerId: null,
      roundWinnerId: null,
    };
    const { deck, tableState: dealtState } = startNewRound(freshState, rules);
    fullDeckRef.current = deck;
    setTableState(dealtState);

    networkSync.broadcast({
      type: 'TABLE_SYNC',
      roomCode: tableState.roomCode,
      tableState: dealtState,
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 font-sans text-slate-100">
      {/* Viewport Router */}
      {phase === 'TITLE' && (
        <TitleScreen
          onStartHost={handleStartHost}
          onStartJoin={() => setPhase('JOIN')}
          onStartPassAndPlay={() => setShowPassAndPlayPicker(true)}
          onOpenRules={() => setShowRules(true)}
          onOpenDiagnostics={() => setShowDiagnostics(true)}
          onOpenSupabaseSettings={() => setShowSupabaseSettings(true)}
          musicMuted={musicMuted}
          onToggleMusic={handleToggleMusic}
          sfxMuted={sfxMuted}
          onToggleSfx={handleToggleSfx}
        />
      )}

      {phase === 'HOST_SETUP' && (
        <HostSetupScreen
          defaultRoomCode={tableState.roomCode}
          onBack={handleLeaveRoom}
          onConfirmHost={handleConfirmHost}
        />
      )}

      {phase === 'JOIN' && (
        <JoinScreen
          initialRoomCode={tableState.roomCode}
          onBack={handleLeaveRoom}
          onConfirmJoin={handleConfirmJoin}
        />
      )}

      {phase === 'LOBBY' && (
        <LobbyScreen
          roomCode={tableState.roomCode}
          players={tableState.players}
          localPlayerId={localPlayerId}
          isHost={isHost}
          rules={tableState.rules}
          onRemovePlayer={handleRemovePlayer}
          onStartGame={handleHostStartGame}
          onLeaveRoom={handleLeaveRoom}
          onOpenSupabaseSettings={() => setShowSupabaseSettings(true)}
        />
      )}

      {phase === 'PLAYING' && (
        <>
          {/* Pass & Play Interstitial Screen */}
          {passAndPlayWaiting ? (
            <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 shadow-xl shadow-amber-950/50 flex items-center justify-center font-heading font-black text-2xl text-slate-950 mb-4">
                !
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-white mb-2">
                Pass Phone To{' '}
                <span className="text-amber-400">
                  {tableState.players[tableState.currentPlayerIndex]?.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mb-6 max-w-xs">
                Keep the screen hidden from other players while passing the device.
              </p>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setPassAndPlayWaiting(false);
                }}
                className="py-4 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-bold text-sm shadow-xl shadow-emerald-950/60 cursor-pointer"
              >
                I AM READY, SHOW MY HAND
              </button>
            </div>
          ) : (
            <GameTable
              tableState={tableState}
              localPlayerId={localPlayerId}
              isHost={isHost}
              onPlayCard={handleClientPlayCard}
              onDrawCard={handleClientDrawCard}
              onCallUno={handleClientCallUno}
              onCatchUno={handleClientCatchUno}
              onNextRound={handleNextRound}
              onRestartMatch={handleRestartMatch}
              onOpenRules={() => setShowRules(true)}
              onOpenSupabaseSettings={() => setShowSupabaseSettings(true)}
              onLeaveGame={handleLeaveRoom}
              musicMuted={musicMuted}
              onToggleMusic={handleToggleMusic}
              sfxMuted={sfxMuted}
              onToggleSfx={handleToggleSfx}
            />
          )}
        </>
      )}

      {/* Pass & Play Player Count Picker Modal (2 to 8 players) */}
      {showPassAndPlayPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center gap-5">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Pass & Play (1 Device)
              </span>
              <h2 className="font-heading font-extrabold text-xl text-white mt-1">
                How Many Players?
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select between 2 to 8 human players
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2.5 w-full">
              {[2, 3, 4, 5, 6, 7, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    handleStartPassAndPlay(count);
                  }}
                  className="py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400 hover:bg-amber-400/10 font-heading font-extrabold text-lg text-white hover:text-amber-400 transition-all cursor-pointer shadow-sm"
                >
                  {count}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setShowPassAndPlayPicker(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Global Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Global Android Host Server Diagnostics Modal */}
      {showDiagnostics && (
        <DiagnosticsModal
          roomCode={tableState.roomCode}
          connectedCount={tableState.players.length || 1}
          onClose={() => setShowDiagnostics(false)}
          onOpenSupabaseSettings={() => setShowSupabaseSettings(true)}
        />
      )}

      {/* Supabase Realtime Engine Settings Modal */}
      {showSupabaseSettings && (
        <SupabaseSettingsModal
          roomCode={tableState.roomCode}
          onClose={() => setShowSupabaseSettings(false)}
        />
      )}
    </div>
  );
}
