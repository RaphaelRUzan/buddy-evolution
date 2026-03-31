/**
 * XP calculation engine.
 * Converts session metrics into XP using token rates, tool call bonuses,
 * quest completion rewards, and streak multipliers.
 */

import type { SessionMetrics, StreakInfo } from './evolution-types.js'
import { XP_RATES, STREAK } from './evolution-types.js'

/**
 * Calculate the streak multiplier based on consecutive days.
 * Day 1 = 1.0x, scales +0.1x per day, caps at 2.0x (day 11+).
 */
export function getStreakMultiplier(currentDays: number): number {
  if (currentDays <= 0) return STREAK.BASE_MULTIPLIER
  const multiplier = STREAK.BASE_MULTIPLIER + (currentDays - 1) * STREAK.INCREMENT_PER_DAY
  return Math.min(STREAK.MAX_MULTIPLIER, multiplier)
}

/**
 * Update streak based on session date vs last session date.
 * - Same day: streak unchanged
 * - Next day: streak + 1
 * - Gap of 2+ days: reset to 1
 */
export function updateStreak(streak: StreakInfo, sessionDate: string): StreakInfo {
  if (!streak.lastSessionDate) {
    return { currentDays: 1, lastSessionDate: sessionDate }
  }

  const last = new Date(streak.lastSessionDate + 'T00:00:00')
  const current = new Date(sessionDate + 'T00:00:00')
  const diffMs = current.getTime() - last.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    // Same day — no change
    return { ...streak }
  } else if (diffDays === 1) {
    // Consecutive day — increment
    return { currentDays: streak.currentDays + 1, lastSessionDate: sessionDate }
  } else {
    // Gap — reset
    return { currentDays: 1, lastSessionDate: sessionDate }
  }
}

/**
 * Calculate base XP from a session (before streak multiplier).
 */
export function calculateBaseXP(session: SessionMetrics): number {
  const tokenXP = session.outputTokens * XP_RATES.OUTPUT_TOKEN
    + session.inputTokens * XP_RATES.INPUT_TOKEN
  const toolXP = session.toolCalls * XP_RATES.TOOL_CALL
  const questBonus = session.sessionDurationMinutes >= XP_RATES.QUEST_THRESHOLD_MINUTES
    ? XP_RATES.QUEST_BONUS
    : 0

  return tokenXP + toolXP + questBonus
}

/**
 * Calculate total session XP with streak multiplier applied.
 */
export function calculateSessionXP(session: SessionMetrics, streak: StreakInfo): number {
  const base = calculateBaseXP(session)
  const multiplier = getStreakMultiplier(streak.currentDays)
  return Math.floor(base * multiplier)
}
