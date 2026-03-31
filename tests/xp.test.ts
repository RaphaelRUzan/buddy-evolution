import { describe, it, expect } from 'vitest'
import {
  getStreakMultiplier, updateStreak, calculateBaseXP, calculateSessionXP,
} from '../src/xp.js'
import type { SessionMetrics, StreakInfo } from '../src/evolution-types.js'

// --- Helper ---

function makeSession(overrides: Partial<SessionMetrics> = {}): SessionMetrics {
  return {
    outputTokens: 0,
    inputTokens: 0,
    toolCalls: 0,
    rejectedToolCalls: 0,
    sessionDurationMinutes: 0,
    fileEdits: 0,
    testRuns: 0,
    forceSnips: 0,
    contextResets: 0,
    sessionDate: '2026-03-31',
    ...overrides,
  }
}

describe('getStreakMultiplier', () => {
  it('should return 1.0 for day 0 or negative', () => {
    expect(getStreakMultiplier(0)).toBe(1.0)
    expect(getStreakMultiplier(-1)).toBe(1.0)
  })

  it('should return 1.0 for day 1', () => {
    expect(getStreakMultiplier(1)).toBe(1.0)
  })

  it('should return 1.1 for day 2', () => {
    expect(getStreakMultiplier(2)).toBeCloseTo(1.1)
  })

  it('should return 1.5 for day 6', () => {
    expect(getStreakMultiplier(6)).toBeCloseTo(1.5)
  })

  it('should cap at 2.0 for day 11+', () => {
    expect(getStreakMultiplier(11)).toBe(2.0)
    expect(getStreakMultiplier(50)).toBe(2.0)
    expect(getStreakMultiplier(100)).toBe(2.0)
  })
})

describe('updateStreak', () => {
  it('should start a new streak from empty', () => {
    const streak: StreakInfo = { currentDays: 0, lastSessionDate: '' }
    const result = updateStreak(streak, '2026-03-31')
    expect(result.currentDays).toBe(1)
    expect(result.lastSessionDate).toBe('2026-03-31')
  })

  it('should keep streak unchanged on same day', () => {
    const streak: StreakInfo = { currentDays: 5, lastSessionDate: '2026-03-31' }
    const result = updateStreak(streak, '2026-03-31')
    expect(result.currentDays).toBe(5)
  })

  it('should increment streak on consecutive day', () => {
    const streak: StreakInfo = { currentDays: 3, lastSessionDate: '2026-03-30' }
    const result = updateStreak(streak, '2026-03-31')
    expect(result.currentDays).toBe(4)
    expect(result.lastSessionDate).toBe('2026-03-31')
  })

  it('should reset streak on 2-day gap', () => {
    const streak: StreakInfo = { currentDays: 10, lastSessionDate: '2026-03-28' }
    const result = updateStreak(streak, '2026-03-31')
    expect(result.currentDays).toBe(1)
    expect(result.lastSessionDate).toBe('2026-03-31')
  })

  it('should handle month boundaries', () => {
    const streak: StreakInfo = { currentDays: 5, lastSessionDate: '2026-03-31' }
    const result = updateStreak(streak, '2026-04-01')
    expect(result.currentDays).toBe(6)
  })
})

describe('calculateBaseXP', () => {
  it('should calculate 0 XP for empty session', () => {
    const session = makeSession()
    expect(calculateBaseXP(session)).toBe(0)
  })

  it('should give 1 XP per output token', () => {
    const session = makeSession({ outputTokens: 1000 })
    expect(calculateBaseXP(session)).toBe(1000)
  })

  it('should give 0.5 XP per input token', () => {
    const session = makeSession({ inputTokens: 1000 })
    expect(calculateBaseXP(session)).toBe(500)
  })

  it('should give 100 XP per tool call', () => {
    const session = makeSession({ toolCalls: 10 })
    expect(calculateBaseXP(session)).toBe(1000)
  })

  it('should give quest bonus for 30+ minute sessions', () => {
    const session = makeSession({ sessionDurationMinutes: 30 })
    expect(calculateBaseXP(session)).toBe(5000)
  })

  it('should not give quest bonus for < 30 minute sessions', () => {
    const session = makeSession({ sessionDurationMinutes: 29 })
    expect(calculateBaseXP(session)).toBe(0)
  })

  it('should combine all XP sources', () => {
    const session = makeSession({
      outputTokens: 5000,    // 5000 XP
      inputTokens: 2000,     // 1000 XP
      toolCalls: 20,         // 2000 XP
      sessionDurationMinutes: 45, // 5000 XP quest bonus
    })
    expect(calculateBaseXP(session)).toBe(13000)
  })
})

describe('calculateSessionXP', () => {
  it('should apply streak multiplier', () => {
    const session = makeSession({ outputTokens: 10000 }) // 10000 base XP
    const streak: StreakInfo = { currentDays: 6, lastSessionDate: '2026-03-30' }
    // 10000 * 1.5 = 15000
    expect(calculateSessionXP(session, streak)).toBe(15000)
  })

  it('should floor the result', () => {
    const session = makeSession({ inputTokens: 1 }) // 0.5 base XP
    const streak: StreakInfo = { currentDays: 1, lastSessionDate: '2026-03-31' }
    // 0.5 * 1.0 = 0.5 → floor = 0
    expect(calculateSessionXP(session, streak)).toBe(0)
  })

  it('should apply max streak multiplier', () => {
    const session = makeSession({ outputTokens: 1000 })
    const streak: StreakInfo = { currentDays: 20, lastSessionDate: '2026-03-30' }
    // 1000 * 2.0 = 2000
    expect(calculateSessionXP(session, streak)).toBe(2000)
  })
})
