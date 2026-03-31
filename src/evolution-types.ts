/**
 * Evolution system types — the RPG layer on top of static companion bones.
 * Evolution is purely additive: it never mutates the deterministic base pet.
 */

import type { StatName, CompanionSoul } from './types.js'

// --- Evolution Tiers ---

export const EVOLUTION_TIERS = [
  'hatchling', 'juvenile', 'adult', 'elder', 'ascended',
] as const

export type EvolutionTier = (typeof EVOLUTION_TIERS)[number]

export const TIER_THRESHOLDS: Record<EvolutionTier, number> = {
  hatchling: 0,
  juvenile: 100_000,
  adult: 1_000_000,
  elder: 10_000_000,
  ascended: 100_000_000,
}

/** Ordered from highest to lowest for tier resolution */
export const TIER_ORDER: { tier: EvolutionTier; threshold: number }[] = [
  { tier: 'ascended', threshold: 100_000_000 },
  { tier: 'elder', threshold: 10_000_000 },
  { tier: 'adult', threshold: 1_000_000 },
  { tier: 'juvenile', threshold: 100_000 },
  { tier: 'hatchling', threshold: 0 },
]

// --- XP Constants ---

export const XP_RATES = {
  OUTPUT_TOKEN: 1.0,
  INPUT_TOKEN: 0.5,
  TOOL_CALL: 100,
  QUEST_BONUS: 5000,
  QUEST_THRESHOLD_MINUTES: 30,
} as const

export const STREAK = {
  MAX_MULTIPLIER: 2.0,
  INCREMENT_PER_DAY: 0.1,
  BASE_MULTIPLIER: 1.0,
} as const

// --- Lifetime Stats ---

export interface LifetimeStats {
  totalOutputTokens: number
  totalInputTokens: number
  totalToolCalls: number
  totalSessions: number
  totalSessionMinutes: number
  rejectedToolCalls: number
  forceSnips: number
  contextResets: number
  fileEdits: number
  testRuns: number
}

// --- Streak ---

export interface StreakInfo {
  currentDays: number
  lastSessionDate: string // ISO date YYYY-MM-DD
}

// --- Evolution State (persisted) ---

export interface EvolutionState {
  totalXP: number
  tier: EvolutionTier
  lifetimeStats: LifetimeStats
  streak: StreakInfo
  statGrowth: Record<StatName, number>
  customTitle?: string
  evolvedAt: Record<EvolutionTier, number | null>
}

// --- Session Metrics (transient, per-session) ---

export interface SessionMetrics {
  outputTokens: number
  inputTokens: number
  toolCalls: number
  rejectedToolCalls: number
  sessionDurationMinutes: number
  fileEdits: number
  testRuns: number
  forceSnips: number
  contextResets: number
  sessionDate: string // ISO date YYYY-MM-DD
}

// --- Stored companion with evolution ---

export interface StoredCompanionWithEvolution extends CompanionSoul {
  hatchedAt: number
  evolution?: EvolutionState
}

// --- Processing result ---

export interface EvolutionResult {
  newState: EvolutionState
  tierChanged: boolean
  previousTier: EvolutionTier
  xpGained: number
}

// --- Sprite overlay types ---

export interface SpriteOverlay {
  pattern?: string[]   // pattern characters for Adult+
  aura?: string[]      // aura border for Elder+
  particles?: string[] // floating particles for Ascended
}
