import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  initializeGame, 
  playerHit, 
  playerStand, 
  playerDouble, 
  playerSplit, 
  playDealerTurn,
  canSplit,
  canDouble,
  BlackjackGameState,
  Card,
  CardSuit,
  CardRank
} from '../../src/lib/games/blackjack';

// Mock Math.random pour des tests déterministes
const mockMath = Object.create(global.Math);
mockMath.random = vi.fn();
global.Math = mockMath;

describe('Blackjack', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devrait initialiser un jeu avec une mise valide', () => {
    const betAmount = 10;
    const game = initializeGame(betAmount);
    
    expect(game).toBeDefined();
    expect(game.betAmount).toBe(betAmount);
    expect(game.playerHands).toHaveLength(1);
    expect(game.playerHands[0].cards).toHaveLength(2);
    expect(game.dealerHand.cards).toHaveLength(2);
    expect(game.deck.length).toBeGreaterThan(0);
    expect(game.isPlayerTurn).toBe(true);
    expect(game.gameStatus).toBe('playing');
  });

  it('devrait lancer une erreur si la mise est négative ou nulle', () => {
    expect(() => initializeGame(0)).toThrow('Le montant de la mise doit être supérieur à zéro');
    expect(() => initializeGame(-1)).toThrow('Le montant de la mise doit être supérieur à zéro');
  });

  it('devrait permettre au joueur de prendre une carte (hit)', () => {
    const game = initializeGame(10);
    const initialCardCount = game.playerHands[0].cards.length;
    
    const newState = playerHit(game);
    
    expect(newState.playerHands[0].cards.length).toBe(initialCardCount + 1);
  });

  it('devrait permettre au joueur de rester (stand)', () => {
    const game = initializeGame(10);
    game.isPlayerTurn = true;
    
    const newState = playerStand(game);
    
    expect(newState.isPlayerTurn).toBe(false);
    expect(newState.gameStatus).toBe('dealerTurn');
  });

  it('devrait permettre au croupier de jouer son tour', () => {
    const game = initializeGame(10);
    game.isPlayerTurn = false;
    game.gameStatus = 'dealerTurn';
    
    const finalState = playDealerTurn(game);
    
    expect(finalState.gameStatus).toBe('complete');
    expect(finalState.results.length).toBeGreaterThan(0);
  });

  it('devrait identifier correctement si une main peut être doublée', () => {
    const hand = {
      cards: [
        { suit: CardSuit.HEARTS, rank: CardRank.ACE },
        { suit: CardSuit.SPADES, rank: CardRank.FIVE }
      ],
      score: 16,
      isSoft: true,
      isBusted: false,
      isBlackjack: false
    };
    
    expect(canDouble(hand)).toBe(true);
    
    // Ajouter une carte supplémentaire
    hand.cards.push({ suit: CardSuit.CLUBS, rank: CardRank.TWO });
    
    expect(canDouble(hand)).toBe(false);
  });

  it('devrait identifier correctement si une main peut être splittée', () => {
    // Main avec une paire
    const splitableHand = {
      cards: [
        { suit: CardSuit.HEARTS, rank: CardRank.EIGHT },
        { suit: CardSuit.SPADES, rank: CardRank.EIGHT }
      ],
      score: 16,
      isSoft: false,
      isBusted: false,
      isBlackjack: false
    };
    
    expect(canSplit(splitableHand)).toBe(true);
    
    // Main sans paire
    const nonSplitableHand = {
      cards: [
        { suit: CardSuit.HEARTS, rank: CardRank.EIGHT },
        { suit: CardSuit.SPADES, rank: CardRank.NINE }
      ],
      score: 17,
      isSoft: false,
      isBusted: false,
      isBlackjack: false
    };
    
    expect(canSplit(nonSplitableHand)).toBe(false);
  });
});
