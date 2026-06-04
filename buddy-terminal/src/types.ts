// ═══════════════════════════════════════════════════════════════
// Buddy Terminal — Types
// ═══════════════════════════════════════════════════════════════

export const RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const;
export type Rarity = (typeof RARITIES)[number];

export const SPECIES = [
  'duck',
  'goose',
  'blob',
  'cat',
  'dragon',
  'octopus',
  'owl',
  'penguin',
  'turtle',
  'snail',
  'ghost',
  'axolotl',
  'capybara',
  'cactus',
  'robot',
  'rabbit',
  'mushroom',
  'chonk',
] as const;
export type Species = (typeof SPECIES)[number];

export const EYES = ['·', '✦', '×', '◉', '@', '°'] as const;
export type Eye = (typeof EYES)[number];

export const HATS = [
  'none',
  'crown',
  'tophat',
  'propeller',
  'halo',
  'wizard',
  'beanie',
  'tinyduck',
] as const;
export type Hat = (typeof HATS)[number];

export const STAT_NAMES = [
  'DEBUGGING',
  'PATIENCE',
  'CHAOS',
  'WISDOM',
  'SNARK',
] as const;
export type StatName = (typeof STAT_NAMES)[number];

export const PERSONALITIES = [
  'DEGEN',
  'SCHOLAR',
  'CHAOS_LORD',
  'ZEN_MASTER',
  'ROBOTIC',
  'GREMLIN',
] as const;
export type Personality = (typeof PERSONALITIES)[number];

// Deterministic parts — derived from hash(userId)
export type CompanionBones = {
  rarity: Rarity;
  species: Species;
  eye: Eye;
  hat: Hat;
  shiny: boolean;
  stats: Record<StatName, number>;
  personality: Personality;
  walletAddress: string;
  bio: string;
};

// Full companion with name
export type Companion = CompanionBones & {
  name: string;
  hatchedAt: number;
};

export const RARITY_WEIGHTS = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1,
} as const satisfies Record<Rarity, number>;

export const RARITY_STARS: Record<Rarity, string> = {
  common: '★',
  uncommon: '★★',
  rare: '★★★',
  epic: '★★★★',
  legendary: '★★★★★',
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '\x1b[90m',     // gray
  uncommon: '\x1b[32m',   // green
  rare: '\x1b[36m',       // cyan
  epic: '\x1b[35m',       // magenta
  legendary: '\x1b[33m',  // yellow/gold
};
