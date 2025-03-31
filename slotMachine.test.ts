import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spin, SpinResult, SlotSymbol } from '../../src/lib/games/slotMachine';

// Mock Math.random pour des tests déterministes
const mockMath = Object.create(global.Math);
mockMath.random = vi.fn();
global.Math = mockMath;

describe('Machine à sous', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devrait générer un résultat valide avec une mise positive', () => {
    // Simuler des valeurs aléatoires pour obtenir un résultat prévisible
    mockMath.random.mockReturnValue(0.5); // Valeur moyenne pour éviter les symboles rares

    const betAmount = 1;
    const activePaylines = 5;
    
    const result = spin(betAmount, activePaylines);
    
    // Vérifications de base
    expect(result).toBeDefined();
    expect(result.reels).toHaveLength(5);
    expect(result.reels[0]).toHaveLength(3);
    expect(result.betAmount).toBe(betAmount * activePaylines);
    
    // Vérification que les symboles sont valides
    result.reels.forEach(reel => {
      reel.forEach(symbol => {
        expect(Object.values(SlotSymbol)).toContain(symbol);
      });
    });
  });

  it('devrait lancer une erreur si la mise est négative ou nulle', () => {
    expect(() => spin(0, 1)).toThrow('Le montant de la mise doit être supérieur à zéro');
    expect(() => spin(-1, 1)).toThrow('Le montant de la mise doit être supérieur à zéro');
  });

  it('devrait lancer une erreur si le nombre de lignes est invalide', () => {
    expect(() => spin(1, 0)).toThrow('Le nombre de lignes actives doit être entre 1 et 20');
    expect(() => spin(1, 21)).toThrow('Le nombre de lignes actives doit être entre 1 et 20');
  });

  it('devrait calculer correctement les gains pour une combinaison gagnante', () => {
    // Simuler une combinaison gagnante spécifique
    mockMath.random
      // Premier rouleau: tous CHERRY
      .mockReturnValueOnce(0.1) // CHERRY en position 0
      .mockReturnValueOnce(0.1) // CHERRY en position 1
      .mockReturnValueOnce(0.1) // CHERRY en position 2
      // Deuxième rouleau: tous CHERRY
      .mockReturnValueOnce(0.1) // CHERRY en position 0
      .mockReturnValueOnce(0.1) // CHERRY en position 1
      .mockReturnValueOnce(0.1) // CHERRY en position 2
      // Troisième rouleau: tous CHERRY
      .mockReturnValueOnce(0.1) // CHERRY en position 0
      .mockReturnValueOnce(0.1) // CHERRY en position 1
      .mockReturnValueOnce(0.1) // CHERRY en position 2
      // Quatrième rouleau: tous différents
      .mockReturnValueOnce(0.3) // ORANGE en position 0
      .mockReturnValueOnce(0.4) // PLUM en position 1
      .mockReturnValueOnce(0.5) // BELL en position 2
      // Cinquième rouleau: tous différents
      .mockReturnValueOnce(0.6) // BAR en position 0
      .mockReturnValueOnce(0.7) // SEVEN en position 1
      .mockReturnValueOnce(0.8); // DIAMOND en position 2

    const betAmount = 1;
    const result = spin(betAmount, 1);
    
    // Vérification des gains
    expect(result.paylineHits.length).toBeGreaterThan(0);
    
    // La première ligne devrait avoir 3 CHERRY consécutifs
    const firstHit = result.paylineHits[0];
    expect(firstHit.symbol).toBe(SlotSymbol.CHERRY);
    expect(firstHit.count).toBe(3);
    expect(firstHit.win).toBe(betAmount * 5); // 3 CHERRY = multiplicateur 5
  });
});
