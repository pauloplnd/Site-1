import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  spin, 
  createStraightBet,
  createRedBet,
  createBlackBet,
  createEvenBet,
  createOddBet,
  BetType,
  RED_NUMBERS,
  BLACK_NUMBERS
} from '../../src/lib/games/roulette';

// Mock Math.random pour des tests déterministes
const mockMath = Object.create(global.Math);
mockMath.random = vi.fn();
global.Math = mockMath;

describe('Roulette', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devrait créer un pari plein valide', () => {
    const bet = createStraightBet(17, 10);
    
    expect(bet).toBeDefined();
    expect(bet.type).toBe(BetType.STRAIGHT);
    expect(bet.numbers).toEqual([17]);
    expect(bet.amount).toBe(10);
  });

  it('devrait lancer une erreur pour un pari plein avec un numéro invalide', () => {
    expect(() => createStraightBet(-1, 10)).toThrow('Le numéro doit être un entier entre 0 et 36');
    expect(() => createStraightBet(37, 10)).toThrow('Le numéro doit être un entier entre 0 et 36');
  });

  it('devrait créer un pari sur rouge valide', () => {
    const bet = createRedBet(10);
    
    expect(bet).toBeDefined();
    expect(bet.type).toBe(BetType.RED);
    expect(bet.numbers).toEqual(RED_NUMBERS);
    expect(bet.amount).toBe(10);
  });

  it('devrait créer un pari sur noir valide', () => {
    const bet = createBlackBet(10);
    
    expect(bet).toBeDefined();
    expect(bet.type).toBe(BetType.BLACK);
    expect(bet.numbers).toEqual(BLACK_NUMBERS);
    expect(bet.amount).toBe(10);
  });

  it('devrait créer un pari sur pair valide', () => {
    const bet = createEvenBet(10);
    
    expect(bet).toBeDefined();
    expect(bet.type).toBe(BetType.EVEN);
    expect(bet.numbers).toContain(2);
    expect(bet.numbers).toContain(4);
    expect(bet.numbers).toContain(36);
    expect(bet.numbers).not.toContain(1);
    expect(bet.amount).toBe(10);
  });

  it('devrait créer un pari sur impair valide', () => {
    const bet = createOddBet(10);
    
    expect(bet).toBeDefined();
    expect(bet.type).toBe(BetType.ODD);
    expect(bet.numbers).toContain(1);
    expect(bet.numbers).toContain(3);
    expect(bet.numbers).toContain(35);
    expect(bet.numbers).not.toContain(2);
    expect(bet.amount).toBe(10);
  });

  it('devrait faire tourner la roulette et calculer les résultats', () => {
    // Simuler un numéro gagnant spécifique (17 - noir)
    mockMath.random.mockReturnValue(17/37);
    
    const bets = [
      createStraightBet(17, 10),  // Pari gagnant
      createStraightBet(18, 10),  // Pari perdant
      createBlackBet(20),         // Pari gagnant
      createRedBet(20),           // Pari perdant
      createOddBet(15)            // Pari gagnant
    ];
    
    const result = spin(bets);
    
    expect(result).toBeDefined();
    expect(result.winningNumber).toBe(17);
    expect(result.totalBet).toBe(75); // 10 + 10 + 20 + 20 + 15
    
    // Vérification des paris gagnants
    expect(result.winningBets.length).toBe(3);
    
    // Le pari plein sur 17 devrait être gagnant
    const straightWin = result.winningBets.find(win => win.bet.type === BetType.STRAIGHT);
    expect(straightWin).toBeDefined();
    expect(straightWin?.payout).toBe(10 * 36); // Mise * (35 + 1)
    
    // Le pari sur noir devrait être gagnant
    const blackWin = result.winningBets.find(win => win.bet.type === BetType.BLACK);
    expect(blackWin).toBeDefined();
    expect(blackWin?.payout).toBe(20 * 2); // Mise * (1 + 1)
    
    // Le pari sur impair devrait être gagnant
    const oddWin = result.winningBets.find(win => win.bet.type === BetType.ODD);
    expect(oddWin).toBeDefined();
    expect(oddWin?.payout).toBe(15 * 2); // Mise * (1 + 1)
  });

  it('devrait lancer une erreur si aucun pari n\'est fourni', () => {
    expect(() => spin([])).toThrow('Au moins un pari est requis');
  });
});
