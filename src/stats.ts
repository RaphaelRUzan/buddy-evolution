/**
 * Usage-driven stat growth system.
 * Each stat is driven by specific usage patterns from session metrics.
 * Growth uses diminishing returns to soft-cap near +100 bonus.
 */

import type { StatName } from './types.js'
import type { SessionMetrics } from './evolution-types.js'

/**
 * Calculate raw stat growth from a session for a given stat.
 * Each stat has a unique driver formula.
 */
export function calculateRawStatGrowth(stat: StatName, session: SessionMetrics): number {
  switch (stat) {
    case 'DEBUGGING':
      // Driven by file edits and test runs
      return (session.fileEdits * 2 + session.testRuns * 5) * 0.1

    case 'WISDOM':
      // Driven by input tokens (lifetime cumulative, but per-session contribution)
      return session.inputTokens * 0.0001

    case 'CHAOS':
      // Driven by ratio of rejected/retried tool calls
      return (session.rejectedToolCalls / Math.max(1, session.toolCalls)) * 10

    case 'PATIENCE':
      // Driven by session duration
      return session.sessionDurationMinutes * 0.05

    case 'SNARK':
      // Driven by force-snips, interrupts, context resets
      return (session.forceSnips * 3 + session.contextResets * 2) * 0.2

    default:
      return 0
  }
}

/**
 * Apply diminishing returns to raw growth.
 * Formula: rawGrowth * (100 / (100 + currentGrowth))
 *
 * At currentGrowth=0: full raw growth applied
 * At currentGrowth=100: half of raw growth applied
 * At currentGrowth=900: 10% of raw growth applied
 * Approaches but never reaches +infinity asymptotically
 */
export function applyDiminishingReturns(rawGrowth: number, currentGrowth: number): number {
  if (rawGrowth <= 0) return 0
  return rawGrowth * (100 / (100 + currentGrowth))
}

/**
 * Calculate actual stat growth for a session, accounting for diminishing returns.
 */
export function calculateStatGrowth(
  stat: StatName,
  session: SessionMetrics,
  currentGrowth: number,
): number {
  const raw = calculateRawStatGrowth(stat, session)
  return applyDiminishingReturns(raw, currentGrowth)
}

/**
 * Compute the effective (display) stat value.
 * Base stat (1-100 from bones) + growth bonus, clamped to [1, 200].
 */
export function getEffectiveStat(baseStat: number, growthBonus: number): number {
  return Math.min(200, Math.max(1, Math.round(baseStat + growthBonus)))
}
