-- Migration number: 0001        2025-03-31T19:50:00.000Z
-- Structure de base de données pour l'application de casino

-- Suppression des tables existantes si elles existent
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS slot_machine_spins;
DROP TABLE IF EXISTS blackjack_hands;
DROP TABLE IF EXISTS roulette_bets;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  is_admin BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Table des portefeuilles virtuels
CREATE TABLE IF NOT EXISTS wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  bonus_balance REAL NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  wallet_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'bet', 'win', 'bonus'
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
  game_session_id INTEGER,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE SET NULL
);

-- Table des jeux disponibles
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'slot', 'blackjack', 'roulette'
  description TEXT,
  min_bet REAL NOT NULL,
  max_bet REAL NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des sessions de jeu
CREATE TABLE IF NOT EXISTS game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  game_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  total_bet REAL NOT NULL DEFAULT 0,
  total_win REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL, -- 'active', 'completed', 'abandoned'
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Table spécifique pour les tours de machine à sous
CREATE TABLE IF NOT EXISTS slot_machine_spins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_session_id INTEGER NOT NULL,
  bet_amount REAL NOT NULL,
  win_amount REAL NOT NULL,
  symbols TEXT NOT NULL, -- JSON array of symbols
  payline_hits TEXT, -- JSON array of payline hits
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

-- Table spécifique pour les mains de blackjack
CREATE TABLE IF NOT EXISTS blackjack_hands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_session_id INTEGER NOT NULL,
  bet_amount REAL NOT NULL,
  win_amount REAL NOT NULL,
  player_cards TEXT NOT NULL, -- JSON array of cards
  dealer_cards TEXT NOT NULL, -- JSON array of cards
  player_score INTEGER NOT NULL,
  dealer_score INTEGER NOT NULL,
  is_blackjack BOOLEAN DEFAULT 0,
  is_split BOOLEAN DEFAULT 0,
  is_double_down BOOLEAN DEFAULT 0,
  result TEXT NOT NULL, -- 'win', 'lose', 'push'
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

-- Table spécifique pour les paris de roulette
CREATE TABLE IF NOT EXISTS roulette_bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_session_id INTEGER NOT NULL,
  bet_amount REAL NOT NULL,
  win_amount REAL NOT NULL,
  bet_type TEXT NOT NULL, -- 'straight', 'split', 'street', 'corner', 'line', 'column', 'dozen', 'red', 'black', 'even', 'odd', 'low', 'high'
  bet_numbers TEXT NOT NULL, -- JSON array of numbers
  winning_number INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

-- Données initiales pour les jeux
INSERT INTO games (name, type, description, min_bet, max_bet) VALUES 
  ('Lucky Slots', 'slot', 'Machine à sous classique avec 5 rouleaux et 20 lignes de paiement', 0.10, 100.00),
  ('Blackjack VIP', 'blackjack', 'Jeu de blackjack classique avec règles standard', 1.00, 500.00),
  ('Roulette Européenne', 'roulette', 'Roulette européenne avec une seule case zéro', 0.50, 1000.00);

-- Création des index pour optimiser les performances
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX idx_slot_machine_spins_game_session_id ON slot_machine_spins(game_session_id);
CREATE INDEX idx_blackjack_hands_game_session_id ON blackjack_hands(game_session_id);
CREATE INDEX idx_roulette_bets_game_session_id ON roulette_bets(game_session_id);
