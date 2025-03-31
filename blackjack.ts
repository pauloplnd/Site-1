/**
 * Blackjack - Logique de jeu
 * 
 * Ce module implémente la logique du jeu de blackjack avec les règles standard.
 * Il gère les cartes, les mains, les scores et les actions possibles (hit, stand, double, split).
 */

// Types de cartes
export enum CardSuit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export enum CardRank {
  ACE = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
}

// Interface pour une carte
export interface Card {
  suit: CardSuit;
  rank: CardRank;
}

// Interface pour une main de blackjack
export interface BlackjackHand {
  cards: Card[];
  score: number;
  isSoft: boolean; // Indique si la main contient un As compté comme 11
  isBusted: boolean; // Indique si la main dépasse 21
  isBlackjack: boolean; // Indique si la main est un blackjack (21 avec 2 cartes)
}

// Interface pour l'état du jeu
export interface BlackjackGameState {
  deck: Card[]; // Jeu de cartes
  playerHands: BlackjackHand[]; // Mains du joueur (plusieurs en cas de split)
  dealerHand: BlackjackHand; // Main du croupier
  currentHandIndex: number; // Index de la main active du joueur
  isPlayerTurn: boolean; // Indique si c'est au tour du joueur
  betAmount: number; // Montant de la mise initiale
  doubledBets: boolean[]; // Indique quelles mains ont doublé la mise
  gameStatus: 'betting' | 'playing' | 'dealerTurn' | 'complete'; // État du jeu
  results: BlackjackResult[]; // Résultats pour chaque main
}

// Interface pour le résultat d'une main
export interface BlackjackResult {
  handIndex: number; // Index de la main
  result: 'win' | 'lose' | 'push' | 'blackjack'; // Résultat
  payout: number; // Gain
}

/**
 * Crée un nouveau jeu de cartes mélangé
 * @param deckCount Nombre de jeux de cartes à utiliser
 * @returns Jeu de cartes mélangé
 */
export function createShuffledDeck(deckCount: number = 6): Card[] {
  const deck: Card[] = [];
  
  // Création de plusieurs jeux de cartes
  for (let d = 0; d < deckCount; d++) {
    // Ajout de toutes les combinaisons de couleurs et de valeurs
    for (const suit of Object.values(CardSuit)) {
      for (const rank of Object.values(CardRank)) {
        deck.push({ suit, rank });
      }
    }
  }
  
  // Mélange du jeu de cartes (algorithme de Fisher-Yates)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

/**
 * Initialise un nouveau jeu de blackjack
 * @param betAmount Montant de la mise
 * @returns État initial du jeu
 */
export function initializeGame(betAmount: number): BlackjackGameState {
  if (betAmount <= 0) {
    throw new Error('Le montant de la mise doit être supérieur à zéro');
  }
  
  const deck = createShuffledDeck();
  
  // Distribution des cartes initiales
  const playerHand: BlackjackHand = {
    cards: [deck.pop()!, deck.pop()!],
    score: 0,
    isSoft: false,
    isBusted: false,
    isBlackjack: false,
  };
  
  const dealerHand: BlackjackHand = {
    cards: [deck.pop()!, deck.pop()!],
    score: 0,
    isSoft: false,
    isBusted: false,
    isBlackjack: false,
  };
  
  // Calcul des scores initiaux
  calculateHandScore(playerHand);
  calculateHandScore(dealerHand);
  
  // Vérification des blackjacks
  playerHand.isBlackjack = playerHand.score === 21 && playerHand.cards.length === 2;
  dealerHand.isBlackjack = dealerHand.score === 21 && dealerHand.cards.length === 2;
  
  // Détermination de l'état du jeu
  let gameStatus: BlackjackGameState['gameStatus'] = 'playing';
  let isPlayerTurn = true;
  
  // Si le joueur a un blackjack, c'est au tour du croupier
  if (playerHand.isBlackjack) {
    isPlayerTurn = false;
    gameStatus = 'dealerTurn';
  }
  
  return {
    deck,
    playerHands: [playerHand],
    dealerHand,
    currentHandIndex: 0,
    isPlayerTurn,
    betAmount,
    doubledBets: [false],
    gameStatus,
    results: [],
  };
}

/**
 * Calcule le score d'une main
 * @param hand Main à évaluer
 */
export function calculateHandScore(hand: BlackjackHand): void {
  let score = 0;
  let aceCount = 0;
  
  // Calcul du score de base
  for (const card of hand.cards) {
    if (card.rank === CardRank.ACE) {
      aceCount++;
      score += 11; // Compter l'As comme 11 initialement
    } else if ([CardRank.JACK, CardRank.QUEEN, CardRank.KING].includes(card.rank)) {
      score += 10; // Figures valent 10
    } else {
      // Conversion de la valeur de la carte en nombre
      score += parseInt(card.rank);
    }
  }
  
  // Ajustement des As si nécessaire
  hand.isSoft = aceCount > 0 && score <= 21;
  
  // Si le score dépasse 21 et qu'il y a des As, les compter comme 1 au lieu de 11
  while (score > 21 && aceCount > 0) {
    score -= 10; // Réduire la valeur d'un As de 11 à 1
    aceCount--;
    hand.isSoft = aceCount > 0; // La main est "soft" s'il reste des As comptés comme 11
  }
  
  hand.score = score;
  hand.isBusted = score > 21;
}

/**
 * Action "hit" : le joueur prend une carte supplémentaire
 * @param state État actuel du jeu
 * @returns Nouvel état du jeu
 */
export function playerHit(state: BlackjackGameState): BlackjackGameState {
  if (!state.isPlayerTurn || state.gameStatus !== 'playing') {
    throw new Error('Ce n\'est pas au tour du joueur');
  }
  
  const currentHand = state.playerHands[state.currentHandIndex];
  
  // Ajout d'une carte à la main active
  currentHand.cards.push(state.deck.pop()!);
  calculateHandScore(currentHand);
  
  // Vérification si la main dépasse 21
  if (currentHand.isBusted) {
    return nextHand(state);
  }
  
  return { ...state };
}

/**
 * Action "stand" : le joueur s'arrête avec sa main actuelle
 * @param state État actuel du jeu
 * @returns Nouvel état du jeu
 */
export function playerStand(state: BlackjackGameState): BlackjackGameState {
  if (!state.isPlayerTurn || state.gameStatus !== 'playing') {
    throw new Error('Ce n\'est pas au tour du joueur');
  }
  
  return nextHand(state);
}

/**
 * Action "double" : le joueur double sa mise et reçoit une seule carte supplémentaire
 * @param state État actuel du jeu
 * @returns Nouvel état du jeu
 */
export function playerDouble(state: BlackjackGameState): BlackjackGameState {
  if (!state.isPlayerTurn || state.gameStatus !== 'playing') {
    throw new Error('Ce n\'est pas au tour du joueur');
  }
  
  const currentHand = state.playerHands[state.currentHandIndex];
  
  // Vérification que le doublement est possible (seulement avec 2 cartes)
  if (currentHand.cards.length !== 2) {
    throw new Error('Le doublement n\'est possible qu\'avec 2 cartes');
  }
  
  // Doublement de la mise
  state.doubledBets[state.currentHandIndex] = true;
  
  // Ajout d'une carte et passage à la main suivante
  currentHand.cards.push(state.deck.pop()!);
  calculateHandScore(currentHand);
  
  return nextHand(state);
}

/**
 * Action "split" : le joueur sépare une paire en deux mains distinctes
 * @param state État actuel du jeu
 * @returns Nouvel état du jeu
 */
export function playerSplit(state: BlackjackGameState): BlackjackGameState {
  if (!state.isPlayerTurn || state.gameStatus !== 'playing') {
    throw new Error('Ce n\'est pas au tour du joueur');
  }
  
  const currentHand = state.playerHands[state.currentHandIndex];
  
  // Vérification que le split est possible (2 cartes de même valeur)
  if (currentHand.cards.length !== 2 || 
      getCardValue(currentHand.cards[0]) !== getCardValue(currentHand.cards[1])) {
    throw new Error('Le split n\'est possible qu\'avec une paire');
  }
  
  // Création de deux nouvelles mains
  const card1 = currentHand.cards[0];
  const card2 = currentHand.cards[1];
  
  const hand1: BlackjackHand = {
    cards: [card1, state.deck.pop()!],
    score: 0,
    isSoft: false,
    isBusted: false,
    isBlackjack: false,
  };
  
  const hand2: BlackjackHand = {
    cards: [card2, state.deck.pop()!],
    score: 0,
    isSoft: false,
    isBusted: false,
    isBlackjack: false,
  };
  
  // Calcul des scores
  calculateHandScore(hand1);
  calculateHandScore(hand2);
  
  // Mise à jour de l'état du jeu
  const newPlayerHands = [...state.playerHands];
  newPlayerHands[state.currentHandIndex] = hand1;
  newPlayerHands.splice(state.currentHandIndex + 1, 0, hand2);
  
  // Mise à jour des mises doublées
  const newDoubledBets = [...state.doubledBets];
  newDoubledBets[state.currentHandIndex] = false;
  newDoubledBets.splice(state.currentHandIndex + 1, 0, false);
  
  return {
    ...state,
    playerHands: newPlayerHands,
    doubledBets: newDoubledBets,
  };
}

/**
 * Passe à la main suivante ou au tour du croupier si toutes les mains ont été jouées
 * @param state État actuel du jeu
 * @returns Nouvel état du jeu
 */
function nextHand(state: BlackjackGameState): BlackjackGameState {
  const nextHandIndex = state.currentHandIndex + 1;
  
  // S'il reste des mains à jouer
  if (nextHandIndex < state.playerHands.length) {
    return {
      ...state,
      currentHandIndex: nextHandIndex,
    };
  }
  
  // Sinon, c'est au tour du croupier
  return {
    ...state,
    isPlayerTurn: false,
    gameStatus: 'dealerTurn',
  };
}

/**
 * Tour du croupier : le croupier tire des cartes selon les règles
 * @param state État actuel du jeu
 * @returns Nouvel état du jeu
 */
export function playDealerTurn(state: BlackjackGameState): BlackjackGameState {
  if (state.isPlayerTurn || state.gameStatus !== 'dealerTurn') {
    throw new Error('Ce n\'est pas au tour du croupier');
  }
  
  const dealerHand = { ...state.dealerHand };
  const deck = [...state.deck];
  
  // Le croupier tire des cartes jusqu'à atteindre au moins 17
  while (dealerHand.score < 17) {
    dealerHand.cards.push(deck.pop()!);
    calculateHandScore(dealerHand);
  }
  
  // Calcul des résultats
  const results = calculateResults(state.playerHands, dealerHand, state.betAmount, state.doubledBets);
  
  return {
    ...state,
    deck,
    dealerHand,
    gameStatus: 'complete',
    results,
  };
}

/**
 * Calcule les résultats du jeu
 * @param playerHands Mains du joueur
 * @param dealerHand Main du croupier
 * @param betAmount Montant de la mise initiale
 * @param doubledBets Indique quelles mains ont doublé la mise
 * @returns Résultats pour chaque main
 */
function calculateResults(
  playerHands: BlackjackHand[],
  dealerHand: BlackjackHand,
  betAmount: number,
  doubledBets: boolean[]
): BlackjackResult[] {
  const results: BlackjackResult[] = [];
  
  for (let i = 0; i < playerHands.length; i++) {
    const playerHand = playerHands[i];
    const currentBet = doubledBets[i] ? betAmount * 2 : betAmount;
    let result: BlackjackResult['result'] = 'lose';
    let payout = 0;
    
    // Cas où le joueur a un blackjack
    if (playerHand.isBlackjack) {
      if (dealerHand.isBlackjack) {
        // Égalité de blackjacks
        result = 'push';
        payout = currentBet;
      } else {
        // Blackjack du joueur
        result = 'blackjack';
        payout = currentBet * 2.5; // Paiement 3:2 pour un blackjack
      }
    }
    // Cas où le joueur dépasse 21
    else if (playerHand.isBusted) {
      result = 'lose';
      payout = 0;
    }
    // Cas où le croupier dépasse 21
    else if (dealerHand.isBusted) {
      result = 'win';
      payout = currentBet * 2;
    }
    // Comparaison des scores
    else {
      if (playerHand.score > dealerHand.score) {
        result = 'win';
        payout = currentBet * 2;
      } else if (playerHand.score < dealerHand.score) {
        result = 'lose';
        payout = 0;
      } else {
        result = 'push';
        payout = currentBet;
      }
    }
    
    results.push({
      handIndex: i,
      result,
      payout,
    });
  }
  
  return results;
}

/**
 * Obtient la valeur d'une carte pour le blackjack
 * @param card Carte à évaluer
 * @returns Valeur de la carte
 */
function getCardValue(card: Card): number {
  if (card.rank === CardRank.ACE) {
    return 11;
  } else if ([CardRank.JACK, CardRank.QUEEN, CardRank.KING].includes(card.rank)) {
    return 10;
  } else {
    return parseInt(card.rank);
  }
}

/**
 * Vérifie si une main peut être splittée
 * @param hand Main à vérifier
 * @returns true si la main peut être splittée
 */
export function canSplit(hand: BlackjackHand): boolean {
  return hand.cards.length === 2 && getCardValue(hand.cards[0]) === getCardValue(hand.cards[1]);
}

/**
 * Vérifie si une main peut être doublée
 * @param hand Main à vérifier
 * @returns true si la main peut être doublée
 */
export function canDouble(hand: BlackjackHand): boolean {
  return hand.cards.length === 2;
}

/**
 * Calcule le gain maximum possible pour un montant de mise donné
 * @param betAmount Montant de la mise
 * @returns Gain maximum possible
 */
export function getMaxWin(betAmount: number): number {
  // Le gain maximum est obtenu avec un blackjack (paiement 3:2)
  return betAmount * 2.5;
}

/**
 * Calcule le retour théorique au joueur (RTP)
 * @returns Pourcentage de RTP (entre 0 et 1)
 */
export function getTheoreticalRTP(): number {
  // Valeur typique pour le blackjack avec des règles standard
  // et une stratégie de base optimale
  return 0.995; // 99.5% RTP
}
