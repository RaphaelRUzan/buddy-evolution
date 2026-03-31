/**
 * Core evolution orchestrator.
 * Processes session-end events to update XP, stats, streaks, and tier.
 * This is the single entry point for all evolution state transitions.
 */

import type { StatName } from './types.js'
import { STAT_NAMES } from './types.js'
import type {
  EvolutionState, EvolutionTier, SessionMetrics, EvolutionResult, LifetimeStats,
} from './evolution-types.js'
import { TIER_ORDER } from './evolution-types.js'
import { calculateSessionXP, updateStreak } from './xp.js'
import { calculateStatGrowth } from './stats.js'

/**
 * Resolve the evolution tier from total XP.
 */
export function resolveTier(totalXP: number): EvolutionTier {
  for (const { tier, threshold } of TIER_ORDER) {
    if (totalXP >= threshold) return tier
  }
  return 'hatchling'
}

/**
 * Create a fresh default evolution state (new hatchling).
 */
export function createDefaultEvolutionState(): EvolutionState {
  return {
    totalXP: 0,
    tier: 'hatchling',
    lifetimeStats: {
      totalOutputTokens: 0,
      totalInputTokens: 0,
      totalToolCalls: 0,
      totalSessions: 0,
      totalSessionMinutes: 0,
      rejectedToolCalls: 0,
      forceSnips: 0,
      contextResets: 0,
      fileEdits: 0,
      testRuns: 0,
    },
    streak: { currentDays: 0, lastSessionDate: '' },
    statGrowth: {
      DEBUGGING: 0,
      PATIENCE: 0,
      CHAOS: 0,
      WISDOM: 0,
      SNARK: 0,
    },
    evolvedAt: {
      hatchling: null,
      juvenile: null,
      adult: null,
      elder: null,
      ascended: null,
    },
  }
}

/**
 * Accumulate session metrics into lifetime stats.
 */
function accumulateLifetimeStats(lifetime: LifetimeStats, session: SessionMetrics): LifetimeStats {
  return {
    totalOutputTokens: lifetime.totalOutputTokens + session.outputTokens,
    totalInputTokens: lifetime.totalInputTokens + session.inputTokens,
    totalToolCalls: lifetime.totalToolCalls + session.toolCalls,
    totalSessions: lifetime.totalSessions + 1,
    totalSessionMinutes: lifetime.totalSessionMinutes + session.sessionDurationMinutes,
    rejectedToolCalls: lifetime.rejectedToolCalls + session.rejectedToolCalls,
    forceSnips: lifetime.forceSnips + session.forceSnips,
    contextResets: lifetime.contextResets + session.contextResets,
    fileEdits: lifetime.fileEdits + session.fileEdits,
    testRuns: lifetime.testRuns + session.testRuns,
  }
}

/**
 * Process a session end and produce the new evolution state.
 * This is the main entry point — called once per session.
 */
export function processSessionEnd(
  currentState: EvolutionState,
  session: SessionMetrics,
): EvolutionResult {
  const previousTier = currentState.tier

  // 1. Update streak
  const newStreak = updateStreak(currentState.streak, session.sessionDate)

  // 2. Calculate XP (streak is updated first so current session benefits)
  const xpGained = calculateSessionXP(session, newStreak)

  // 3. Accumulate XP and lifetime stats
  const totalXP = currentState.totalXP + xpGained
  const lifetimeStats = accumulateLifetimeStats(currentState.lifetimeStats, session)

  // 4. Grow stats with diminishing returns
  const statGrowth = { ...currentState.statGrowth }
  for (const stat of STAT_NAMES) {
    statGrowth[stat] += calculateStatGrowth(stat, session, statGrowth[stat])
  }

  // 5. Resolve tier
  const newTier = resolveTier(totalXP)
  const tierChanged = newTier !== previousTier

  // 6. Record tier transition timestamp
  const evolvedAt = { ...currentState.evolvedAt }
  if (tierChanged && evolvedAt[newTier] === null) {
    evolvedAt[newTier] = Date.now()
  }

  // 7. Assign custom title at Ascended
  const customTitle = newTier === 'ascended' && !currentState.customTitle
    ? 'The Ascended'
    : currentState.customTitle

  const newState: EvolutionState = {
    totalXP,
    tier: newTier,
    lifetimeStats,
    streak: newStreak,
    statGrowth,
    customTitle,
    evolvedAt,
  }

  return { newState, tierChanged, previousTier, xpGained }
}
