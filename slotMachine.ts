/**
 * Machine à sous - Logique de jeu
 * 
 * Ce module implémente la logique d'une machine à sous avec 5 rouleaux et 20 lignes de paiement.
 * Il gère les symboles, les combinaisons gagnantes, les multiplicateurs et le calcul des gains.
 */

// Types de symboles disponibles
export enum SlotSymbol {
  CHERRY = 'cherry',
  LEMON = 'lemon',
  ORANGE = 'orange',
  PLUM = 'plum',
  BELL = 'bell',
  BAR = 'bar',
  SEVEN = 'seven',
  DIAMOND = 'diamond',
  WILD = 'wild',
}

// Structure pour les informations de paiement par symbole
interface SymbolPayInfo {
  symbol: SlotSymbol;
  name: string;
  payouts: { [count: number]: number }; // Multiplicateurs pour 3, 4, 5 symboles
}

// Configuration des paiements pour chaque symbole
export const SYMBOL_PAYS: SymbolPayInfo[] = [
  { 
    symbol: SlotSymbol.CHERRY, 
    name: 'Cerise', 
    payouts: { 3: 5, 4: 10, 5: 20 } 
  },
  { 
    symbol: SlotSymbol.LEMON, 
    name: 'Citron', 
    payouts: { 3: 5, 4: 15, 5: 25 } 
  },
  { 
    symbol: SlotSymbol.ORANGE, 
    name: 'Orange', 
    payouts: { 3: 10, 4: 20, 5: 30 } 
  },
  { 
    symbol: SlotSymbol.PLUM, 
    name: 'Prune', 
    payouts: { 3: 15, 4: 25, 5: 40 } 
  },
  { 
    symbol: SlotSymbol.BELL, 
    name: 'Cloche', 
    payouts: { 3: 20, 4: 40, 5: 60 } 
  },
  { 
    symbol: SlotSymbol.BAR, 
    name: 'Bar', 
    payouts: { 3: 25, 4: 50, 5: 100 } 
  },
  { 
    symbol: SlotSymbol.SEVEN, 
    name: 'Sept', 
    payouts: { 3: 50, 4: 100, 5: 200 } 
  },
  { 
    symbol: SlotSymbol.DIAMOND, 
    name: 'Diamant', 
    payouts: { 3: 100, 4: 200, 5: 500 } 
  },
  { 
    symbol: SlotSymbol.WILD, 
    name: 'Joker', 
    payouts: { 3: 200, 4: 500, 5: 1000 } 
  },
];

// Configuration des lignes de paiement (indices des positions sur les 5 rouleaux)
// Chaque ligne est représentée par 5 indices (un par rouleau)
// Les indices vont de 0 à 2 (haut, milieu, bas)
export const PAYLINES = [
  [1, 1, 1, 1, 1], // Ligne horizontale du milieu
  [0, 0, 0, 0, 0], // Ligne horizontale du haut
  [2, 2, 2, 2, 2], // Ligne horizontale du bas
  [0, 1, 2, 1, 0], // V shape
  [2, 1, 0, 1, 2], // Λ shape
  [0, 0, 1, 2, 2], // Diagonale descendante
  [2, 2, 1, 0, 0], // Diagonale montante
  [0, 1, 1, 1, 0], // U shape
  [2, 1, 1, 1, 2], // Π shape
  [1, 0, 0, 0, 1], // U shape inversé
  [1, 2, 2, 2, 1], // Π shape inversé
  [0, 0, 1, 0, 0], // Ligne en zigzag haut
  [2, 2, 1, 2, 2], // Ligne en zigzag bas
  [1, 0, 1, 0, 1], // Ligne en zigzag milieu-haut
  [1, 2, 1, 2, 1], // Ligne en zigzag milieu-bas
  [0, 1, 0, 1, 0], // Ligne en zigzag alternée haut
  [2, 1, 2, 1, 2], // Ligne en zigzag alternée bas
  [0, 2, 0, 2, 0], // Ligne en zigzag extrême
  [2, 0, 2, 0, 2], // Ligne en zigzag extrême inversée
  [1, 1, 0, 1, 1], // Ligne avec creux en haut
];

// Interface pour les résultats d'un tour de machine à sous
export interface SpinResult {
  reels: SlotSymbol[][]; // Symboles sur les rouleaux
  paylineHits: PaylineHit[]; // Lignes gagnantes
  totalWin: number; // Gain total
  betAmount: number; // Montant misé
}

// Interface pour une ligne gagnante
export interface PaylineHit {
  paylineIndex: number; // Index de la ligne de paiement
  symbol: SlotSymbol; // Symbole gagnant
  count: number; // Nombre de symboles consécutifs
  positions: number[][]; // Positions des symboles gagnants
  multiplier: number; // Multiplicateur de gain
  win: number; // Montant gagné
}

/**
 * Génère un tour aléatoire de machine à sous
 * @param betAmount Montant misé par ligne
 * @param activePaylines Nombre de lignes actives (1-20)
 * @returns Résultat du tour
 */
export function spin(betAmount: number, activePaylines: number = 20): SpinResult {
  // Vérification des paramètres
  if (betAmount <= 0) {
    throw new Error('Le montant de la mise doit être supérieur à zéro');
  }
  
  if (activePaylines < 1 || activePaylines > 20) {
    throw new Error('Le nombre de lignes actives doit être entre 1 et 20');
  }

  // Génération des symboles sur les rouleaux
  const reels: SlotSymbol[][] = generateReels();
  
  // Calcul des gains pour chaque ligne active
  const paylineHits: PaylineHit[] = [];
  let totalWin = 0;
  
  for (let i = 0; i < activePaylines; i++) {
    const hit = evaluatePayline(reels, i);
    if (hit) {
      // Calcul du gain pour cette ligne
      const symbolInfo = SYMBOL_PAYS.find(s => s.symbol === hit.symbol);
      if (symbolInfo && symbolInfo.payouts[hit.count]) {
        const multiplier = symbolInfo.payouts[hit.count];
        const win = betAmount * multiplier;
        
        paylineHits.push({
          ...hit,
          multiplier,
          win
        });
        
        totalWin += win;
      }
    }
  }
  
  return {
    reels,
    paylineHits,
    totalWin,
    betAmount: betAmount * activePaylines
  };
}

/**
 * Génère les symboles pour les 5 rouleaux
 * @returns Tableau 2D de symboles
 */
function generateReels(): SlotSymbol[][] {
  const reels: SlotSymbol[][] = [];
  const symbols = Object.values(SlotSymbol);
  
  // Génération de 5 rouleaux avec 3 symboles chacun
  for (let i = 0; i < 5; i++) {
    const reel: SlotSymbol[] = [];
    
    // Chaque rouleau a 3 positions (haut, milieu, bas)
    for (let j = 0; j < 3; j++) {
      // Sélection aléatoire d'un symbole
      // Les symboles de plus grande valeur ont moins de chances d'apparaître
      let randomIndex: number;
      const rand = Math.random();
      
      if (rand < 0.01) { // 1% de chance pour WILD
        randomIndex = symbols.indexOf(SlotSymbol.WILD);
      } else if (rand < 0.05) { // 4% de chance pour DIAMOND
        randomIndex = symbols.indexOf(SlotSymbol.DIAMOND);
      } else if (rand < 0.15) { // 10% de chance pour SEVEN
        randomIndex = symbols.indexOf(SlotSymbol.SEVEN);
      } else {
        // Répartition équitable pour les autres symboles
        randomIndex = Math.floor(Math.random() * (symbols.length - 3));
      }
      
      reel.push(symbols[randomIndex]);
    }
    
    reels.push(reel);
  }
  
  return reels;
}

/**
 * Évalue une ligne de paiement pour déterminer les gains
 * @param reels Symboles sur les rouleaux
 * @param paylineIndex Index de la ligne de paiement à évaluer
 * @returns Informations sur la ligne gagnante ou null si pas de gain
 */
function evaluatePayline(reels: SlotSymbol[][], paylineIndex: number): Omit<PaylineHit, 'multiplier' | 'win'> | null {
  const payline = PAYLINES[paylineIndex];
  const positions: number[][] = [];
  
  // Récupération des symboles sur la ligne de paiement
  const lineSymbols: SlotSymbol[] = [];
  for (let i = 0; i < payline.length; i++) {
    const rowIndex = payline[i];
    lineSymbols.push(reels[i][rowIndex]);
    positions.push([i, rowIndex]);
  }
  
  // Vérification des combinaisons gagnantes (au moins 3 symboles identiques consécutifs)
  let currentSymbol = lineSymbols[0];
  let count = 1;
  let maxCount = 1;
  let maxSymbol = currentSymbol;
  let maxPositions = [positions[0]];
  
  for (let i = 1; i < lineSymbols.length; i++) {
    const symbol = lineSymbols[i];
    
    // Le symbole WILD peut remplacer n'importe quel symbole
    if (symbol === currentSymbol || symbol === SlotSymbol.WILD || currentSymbol === SlotSymbol.WILD) {
      count++;
      maxPositions.push(positions[i]);
    } else {
      // Nouvelle séquence
      if (count > maxCount) {
        maxCount = count;
        maxSymbol = currentSymbol === SlotSymbol.WILD ? symbol : currentSymbol;
        maxPositions = maxPositions.slice(0, count);
      }
      
      currentSymbol = symbol;
      count = 1;
      maxPositions = [positions[i]];
    }
  }
  
  // Mise à jour si la dernière séquence est la plus longue
  if (count > maxCount) {
    maxCount = count;
    maxSymbol = currentSymbol;
  }
  
  // Une combinaison gagnante nécessite au moins 3 symboles identiques
  if (maxCount >= 3) {
    return {
      paylineIndex,
      symbol: maxSymbol,
      count: maxCount,
      positions: maxPositions.slice(0, maxCount)
    };
  }
  
  return null;
}

/**
 * Calcule le gain maximum possible pour un montant de mise donné
 * @param betAmount Montant misé par ligne
 * @returns Gain maximum possible
 */
export function getMaxWin(betAmount: number): number {
  // Le gain maximum est obtenu avec 5 symboles WILD sur une ligne
  const wildInfo = SYMBOL_PAYS.find(s => s.symbol === SlotSymbol.WILD);
  if (wildInfo && wildInfo.payouts[5]) {
    return betAmount * wildInfo.payouts[5];
  }
  return 0;
}

/**
 * Calcule le retour théorique au joueur (RTP)
 * @returns Pourcentage de RTP (entre 0 et 1)
 */
export function getTheoreticalRTP(): number {
  // Valeur typique pour une machine à sous en ligne
  // Cette valeur devrait être calculée précisément en fonction des probabilités
  // et des paiements, mais nous utilisons une approximation ici
  return 0.96; // 96% RTP
}
