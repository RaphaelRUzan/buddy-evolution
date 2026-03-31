/**
 * Mirrored base types from the BUDDY companion pet system.
 * These faithfully reproduce the original type definitions and deterministic
 * generation constants. Species, rarity, stats are all derived from account ID.
 */

// --- Species ---

export const SPECIES = [
  'duck', 'goose', 'blob', 'cat', 'dragon', 'octopus',
  'owl', 'penguin', 'turtle', 'snail', 'ghost', 'axolotl',
  'capybara', 'cactus', 'robot', 'rabbit', 'mushroom', 'chonk',
] as const

export type Species = (typeof SPECIES)[number]

// --- Eyes ---

export const EYES = ['·', '✦', '×', '◉', '@', '°'] as const
export type Eye = (typeof EYES)[number]

// --- Hats ---

export const HATS = [
  'none', 'crown', 'tophat', 'propeller', 'halo',
  'wizard', 'beanie', 'tinyduck',
] as const
export type Hat = (typeof HATS)[number]

// --- Rarity ---

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
export type Rarity = (typeof RARITIES)[number]

export const RARITY_WEIGHTS: { rarity: Rarity; weight: number; statFloor: number }[] = [
  { rarity: 'common', weight: 0.60, statFloor: 5 },
  { rarity: 'uncommon', weight: 0.25, statFloor: 15 },
  { rarity: 'rare', weight: 0.10, statFloor: 25 },
  { rarity: 'epic', weight: 0.04, statFloor: 35 },
  { rarity: 'legendary', weight: 0.01, statFloor: 50 },
]

// --- Stats ---

export const STAT_NAMES = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'] as const
export type StatName = (typeof STAT_NAMES)[number]

export type Stats = Record<StatName, number>

// --- Companion Types ---

export interface CompanionBones {
  rarity: Rarity
  species: Species
  eye: Eye
  hat: Hat
  shiny: boolean
  stats: Stats
  inspirationSeed: number
}

export interface CompanionSoul {
  name: string
  personality: string
}

export interface Companion extends CompanionBones, CompanionSoul {
  hatchedAt: number
}

export interface StoredCompanion extends CompanionSoul {
  hatchedAt: number
}

// --- PRNG salt (matches original) ---

export const COMPANION_SALT = 'friend-2026-401'
