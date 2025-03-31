/**
 * Roulette - Logique de jeu
 * 
 * Ce module implémente la logique du jeu de roulette européenne avec une seule case zéro.
 * Il gère les différents types de paris, le calcul des gains et la génération des numéros gagnants.
 */

// Types de paris disponibles
export enum BetType {
  STRAIGHT = 'straight', // Plein (un seul numéro)
  SPLIT = 'split', // Cheval (deux numéros adjacents)
  STREET = 'street', // Transversale (trois numéros sur une ligne)
  CORNER = 'corner', // Carré (quatre numéros formant un carré)
  LINE = 'line', // Sixain (six numéros sur deux lignes)
  COLUMN = 'column', // Colonne (12 numéros dans une colonne)
  DOZEN = 'dozen', // Douzaine (12 numéros consécutifs)
  RED = 'red', // Rouge
  BLACK = 'black', // Noir
  EVEN = 'even', // Pair
  ODD = 'odd', // Impair
  LOW = 'low', // Manque (1-18)
  HIGH = 'high', // Passe (19-36)
}

// Interface pour un pari
export interface RouletteBet {
  type: BetType;
  numbers: number[]; // Numéros couverts par le pari
  amount: number; // Montant misé
}

// Interface pour le résultat d'un tour de roulette
export interface RouletteSpinResult {
  winningNumber: number; // Numéro gagnant
  winningBets: WinningBet[]; // Paris gagnants
  totalWin: number; // Gain total
  totalBet: number; // Montant total misé
}

// Interface pour un pari gagnant
export interface WinningBet {
  bet: RouletteBet; // Pari original
  payout: number; // Gain
}

// Configuration des numéros rouges et noirs
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

// Configuration des multiplicateurs de gain par type de pari
export const PAYOUT_MULTIPLIERS: Record<BetType, number> = {
  [BetType.STRAIGHT]: 35, // 35:1
  [BetType.SPLIT]: 17, // 17:1
  [BetType.STREET]: 11, // 11:1
  [BetType.CORNER]: 8, // 8:1
  [BetType.LINE]: 5, // 5:1
  [BetType.COLUMN]: 2, // 2:1
  [BetType.DOZEN]: 2, // 2:1
  [BetType.RED]: 1, // 1:1
  [BetType.BLACK]: 1, // 1:1
  [BetType.EVEN]: 1, // 1:1
  [BetType.ODD]: 1, // 1:1
  [BetType.LOW]: 1, // 1:1
  [BetType.HIGH]: 1, // 1:1
};

/**
 * Crée un pari sur un numéro plein
 * @param number Numéro sur lequel parier (0-36)
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createStraightBet(number: number, amount: number): RouletteBet {
  validateNumber(number, 0, 36);
  validateAmount(amount);
  
  return {
    type: BetType.STRAIGHT,
    numbers: [number],
    amount,
  };
}

/**
 * Crée un pari sur deux numéros adjacents (cheval)
 * @param number1 Premier numéro
 * @param number2 Deuxième numéro
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createSplitBet(number1: number, number2: number, amount: number): RouletteBet {
  validateNumber(number1, 1, 36);
  validateNumber(number2, 1, 36);
  validateAmount(amount);
  
  // Vérification que les numéros sont adjacents
  if (!areNumbersAdjacent(number1, number2)) {
    throw new Error('Les numéros doivent être adjacents pour un pari cheval');
  }
  
  return {
    type: BetType.SPLIT,
    numbers: [number1, number2],
    amount,
  };
}

/**
 * Crée un pari sur trois numéros alignés (transversale)
 * @param row Numéro de la ligne (0-11)
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createStreetBet(row: number, amount: number): RouletteBet {
  validateNumber(row, 0, 11);
  validateAmount(amount);
  
  // Calcul des numéros de la ligne
  const startNumber = row * 3 + 1;
  const numbers = [startNumber, startNumber + 1, startNumber + 2];
  
  return {
    type: BetType.STREET,
    numbers,
    amount,
  };
}

/**
 * Crée un pari sur quatre numéros formant un carré
 * @param corner Numéro du coin (le plus petit des quatre)
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createCornerBet(corner: number, amount: number): RouletteBet {
  validateNumber(corner, 1, 33);
  validateAmount(amount);
  
  // Vérification que le numéro peut former un carré
  if (corner % 3 === 0) {
    throw new Error('Le numéro ne peut pas former un carré');
  }
  
  // Calcul des numéros du carré
  const numbers = [corner, corner + 1, corner + 3, corner + 4];
  
  return {
    type: BetType.CORNER,
    numbers,
    amount,
  };
}

/**
 * Crée un pari sur six numéros (sixain)
 * @param row1 Numéro de la première ligne (0-10)
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createLineBet(row1: number, amount: number): RouletteBet {
  validateNumber(row1, 0, 10);
  validateAmount(amount);
  
  // Calcul des numéros des deux lignes
  const startNumber1 = row1 * 3 + 1;
  const startNumber2 = (row1 + 1) * 3 + 1;
  const numbers = [
    startNumber1, startNumber1 + 1, startNumber1 + 2,
    startNumber2, startNumber2 + 1, startNumber2 + 2,
  ];
  
  return {
    type: BetType.LINE,
    numbers,
    amount,
  };
}

/**
 * Crée un pari sur une colonne
 * @param column Numéro de la colonne (0-2)
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createColumnBet(column: number, amount: number): RouletteBet {
  validateNumber(column, 0, 2);
  validateAmount(amount);
  
  // Calcul des numéros de la colonne
  const numbers: number[] = [];
  for (let i = 0; i < 12; i++) {
    numbers.push(column + 1 + i * 3);
  }
  
  return {
    type: BetType.COLUMN,
    numbers,
    amount,
  };
}

/**
 * Crée un pari sur une douzaine
 * @param dozen Numéro de la douzaine (0-2)
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createDozenBet(dozen: number, amount: number): RouletteBet {
  validateNumber(dozen, 0, 2);
  validateAmount(amount);
  
  // Calcul des numéros de la douzaine
  const startNumber = dozen * 12 + 1;
  const numbers: number[] = [];
  for (let i = 0; i < 12; i++) {
    numbers.push(startNumber + i);
  }
  
  return {
    type: BetType.DOZEN,
    numbers,
    amount,
  };
}

/**
 * Crée un pari sur la couleur rouge
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createRedBet(amount: number): RouletteBet {
  validateAmount(amount);
  
  return {
    type: BetType.RED,
    numbers: [...RED_NUMBERS],
    amount,
  };
}

/**
 * Crée un pari sur la couleur noire
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createBlackBet(amount: number): RouletteBet {
  validateAmount(amount);
  
  return {
    type: BetType.BLACK,
    numbers: [...BLACK_NUMBERS],
    amount,
  };
}

/**
 * Crée un pari sur les numéros pairs
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createEvenBet(amount: number): RouletteBet {
  validateAmount(amount);
  
  // Calcul des numéros pairs
  const numbers: number[] = [];
  for (let i = 2; i <= 36; i += 2) {
    numbers.push(i);
  }
  
  return {
    type: BetType.EVEN,
    numbers,
    amount,
  };
}

/**
 * Crée un pari sur les numéros impairs
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createOddBet(amount: number): RouletteBet {
  validateAmount(amount);
  
  // Calcul des numéros impairs
  const numbers: number[] = [];
  for (let i = 1; i <= 35; i += 2) {
    numbers.push(i);
  }
  
  return {
    type: BetType.ODD,
    numbers,
    amount,
  };
}

/**
 * Crée un pari sur les numéros bas (1-18)
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createLowBet(amount: number): RouletteBet {
  validateAmount(amount);
  
  // Calcul des numéros bas
  const numbers: number[] = [];
  for (let i = 1; i <= 18; i++) {
    numbers.push(i);
  }
  
  return {
    type: BetType.LOW,
    numbers,
    amount,
  };
}

/**
 * Crée un pari sur les numéros hauts (19-36)
 * @param amount Montant à miser
 * @returns Pari créé
 */
export function createHighBet(amount: number): RouletteBet {
  validateAmount(amount);
  
  // Calcul des numéros hauts
  const numbers: number[] = [];
  for (let i = 19; i <= 36; i++) {
    numbers.push(i);
  }
  
  return {
    type: BetType.HIGH,
    numbers,
    amount,
  };
}

/**
 * Fait tourner la roulette et calcule les résultats
 * @param bets Liste des paris
 * @returns Résultat du tour
 */
export function spin(bets: RouletteBet[]): RouletteSpinResult {
  // Vérification qu'il y a au moins un pari
  if (bets.length === 0) {
    throw new Error('Au moins un pari est requis');
  }
  
  // Génération du numéro gagnant
  const winningNumber = generateWinningNumber();
  
  // Calcul des paris gagnants
  const winningBets: WinningBet[] = [];
  let totalWin = 0;
  let totalBet = 0;
  
  for (const bet of bets) {
    totalBet += bet.amount;
    
    // Vérification si le pari est gagnant
    if (bet.numbers.includes(winningNumber)) {
      const multiplier = PAYOUT_MULTIPLIERS[bet.type];
      const payout = bet.amount * (multiplier + 1); // Gain + mise initiale
      
      winningBets.push({
        bet,
        payout,
      });
      
      totalWin += payout;
    }
  }
  
  return {
    winningNumber,
    winningBets,
    totalWin,
    totalBet,
  };
}

/**
 * Génère un numéro gagnant aléatoire (0-36)
 * @returns Numéro gagnant
 */
function generateWinningNumber(): number {
  return Math.floor(Math.random() * 37);
}

/**
 * Vérifie si un numéro est dans la plage spécifiée
 * @param number Numéro à vérifier
 * @param min Valeur minimale
 * @param max Valeur maximale
 */
function validateNumber(number: number, min: number, max: number): void {
  if (number < min || number > max || !Number.isInteger(number)) {
    throw new Error(`Le numéro doit être un entier entre ${min} et ${max}`);
  }
}

/**
 * Vérifie si le montant est valide
 * @param amount Montant à vérifier
 */
function validateAmount(amount: number): void {
  if (amount <= 0) {
    throw new Error('Le montant doit être supérieur à zéro');
  }
}

/**
 * Vérifie si deux numéros sont adjacents sur la table de roulette
 * @param number1 Premier numéro
 * @param number2 Deuxième numéro
 * @returns true si les numéros sont adjacents
 */
function areNumbersAdjacent(number1: number, number2: number): boolean {
  // Vérification de l'adjacence horizontale
  if (Math.abs(number1 - number2) === 1) {
    // Exception pour les numéros en fin de ligne
    if (number1 % 3 === 0 && number2 % 3 === 1) {
      return false;
    }
    if (number2 % 3 === 0 && number1 % 3 === 1) {
      return false;
    }
    return true;
  }
  
  // Vérification de l'adjacence verticale
  if (Math.abs(number1 - number2) === 3) {
    return true;
  }
  
  return false;
}

/**
 * Calcule le gain maximum possible pour un montant de mise donné
 * @param betAmount Montant de la mise
 * @returns Gain maximum possible
 */
export function getMaxWin(betAmount: number): number {
  // Le gain maximum est obtenu avec un pari plein (35:1)
  return betAmount * (PAYOUT_MULTIPLIERS[BetType.STRAIGHT] + 1);
}

/**
 * Calcule le retour théorique au joueur (RTP)
 * @returns Pourcentage de RTP (entre 0 et 1)
 */
export function getTheoreticalRTP(): number {
  // Roulette européenne avec une seule case zéro
  return 36 / 37; // Environ 97.3% RTP
}
