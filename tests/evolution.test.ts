import { describe, it, expect } from 'vitest'
import { resolveTier, createDefaultEvolutionState, processSessionEnd } from '../src/evolution.js'
import type { EvolutionState, SessionMetrics } from '../src/evolution-types.js'

function makeSession(overrides: Partial<SessionMetrics> = {}): SessionMetrics {
  return {
    outputTokens: 0, inputTokens: 0, toolCalls: 0, rejectedToolCalls: 0,
    sessionDurationMinutes: 0, fileEdits: 0, testRuns: 0,
    forceSnips: 0, contextResets: 0, sessionDate: '2026-03-31',
    ...overrides,
  }
}

describe('resolveTier', () => {
  it('should return hatchling for 0 XP', () => {
    expect(resolveTier(0)).toBe('hatchling')
  })

  it('should return hatchling for 99,999 XP', () => {
    expect(resolveTier(99_999)).toBe('hatchling')
  })

  it('should return juvenile at exactly 100K XP', () => {
    expect(resolveTier(100_000)).toBe('juvenile')
  })

  it('should return adult at 1M XP', () => {
    expect(resolveTier(1_000_000)).toBe('adult')
  })

  it('should return elder at 10M XP', () => {
    expect(resolveTier(10_000_000)).toBe('elder')
  })

  it('should return ascended at 100M XP', () => {
    expect(resolveTier(100_000_000)).toBe('ascended')
  })

  it('should return ascended for values beyond 100M', () => {
    expect(resolveTier(500_000_000)).toBe('ascended')
  })
})

describe('createDefaultEvolutionState', () => {
  it('should create a fresh hatchling state', () => {
    const state = createDefaultEvolutionState()
    expect(state.totalXP).toBe(0)
    expect(state.tier).toBe('hatchling')
    expect(state.streak.currentDays).toBe(0)
    expect(state.statGrowth.DEBUGGING).toBe(0)
    expect(state.statGrowth.WISDOM).toBe(0)
    expect(state.lifetimeStats.totalSessions).toBe(0)
    expect(state.evolvedAt.hatchling).toBeNull()
  })
})

describe('processSessionEnd', () => {
  it('should accumulate XP from token throughput', () => {
    const state = createDefaultEvolutionState()
    const session = makeSession({ outputTokens: 5000, inputTokens: 2000 })
    // 5000 * 1 + 2000 * 0.5 = 6000 base, streak 1 = 1.0x → 6000
    const result = processSessionEnd(state, session)
    expect(result.xpGained).toBe(6000)
    expect(result.newState.totalXP).toBe(6000)
  })

  it('should accumulate lifetime stats', () => {
    const state = createDefaultEvolutionState()
    const session = makeSession({
      outputTokens: 1000, inputTokens: 500, toolCalls: 10,
      fileEdits: 5, testRuns: 2,
    })
    const result = processSessionEnd(state, session)
    expect(result.newState.lifetimeStats.totalOutputTokens).toBe(1000)
    expect(result.newState.lifetimeStats.totalInputTokens).toBe(500)
    expect(result.newState.lifetimeStats.totalToolCalls).toBe(10)
    expect(result.newState.lifetimeStats.totalSessions).toBe(1)
    expect(result.newState.lifetimeStats.fileEdits).toBe(5)
    expect(result.newState.lifetimeStats.testRuns).toBe(2)
  })

  it('should start a streak on first session', () => {
    const state = createDefaultEvolutionState()
    const session = makeSession({ outputTokens: 100, sessionDate: '2026-03-31' })
    const result = processSessionEnd(state, session)
    expect(result.newState.streak.currentDays).toBe(1)
    expect(result.newState.streak.lastSessionDate).toBe('2026-03-31')
  })

  it('should increment streak on consecutive days', () => {
    const state: EvolutionState = {
      ...createDefaultEvolutionState(),
      streak: { currentDays: 3, lastSessionDate: '2026-03-30' },
    }
    const session = makeSession({ outputTokens: 100, sessionDate: '2026-03-31' })
    const result = processSessionEnd(state, session)
    expect(result.newState.streak.currentDays).toBe(4)
  })

  it('should trigger tier change at 100K XP', () => {
    const state: EvolutionState = {
      ...createDefaultEvolutionState(),
      totalXP: 99_000,
    }
    // Need 1000+ more XP to cross 100K
    const session = makeSession({ outputTokens: 2000 }) // 2000 XP
    const result = processSessionEnd(state, session)
    expect(result.tierChanged).toBe(true)
    expect(result.previousTier).toBe('hatchling')
    expect(result.newState.tier).toBe('juvenile')
  })

  it('should record tier transition timestamp', () => {
    const state: EvolutionState = {
      ...createDefaultEvolutionState(),
      totalXP: 99_000,
    }
    const session = makeSession({ outputTokens: 2000 })
    const result = processSessionEnd(state, session)
    expect(result.newState.evolvedAt.juvenile).toBeTypeOf('number')
    expect(result.newState.evolvedAt.juvenile).toBeGreaterThan(0)
  })

  it('should not overwrite existing tier timestamps', () => {
    const timestamp = 1700000000000
    const state: EvolutionState = {
      ...createDefaultEvolutionState(),
      totalXP: 200_000,
      tier: 'juvenile',
      evolvedAt: {
        ...createDefaultEvolutionState().evolvedAt,
        juvenile: timestamp,
      },
    }
    // Give enough XP to reach adult
    const session = makeSession({ outputTokens: 900_000 })
    const result = processSessionEnd(state, session)
    expect(result.newState.evolvedAt.juvenile).toBe(timestamp) // preserved
    expect(result.newState.evolvedAt.adult).toBeTypeOf('number') // new
  })

  it('should grow stats based on session metrics', () => {
    const state = createDefaultEvolutionState()
    const session = makeSession({
      fileEdits: 20, testRuns: 10,
      inputTokens: 50000,
      sessionDurationMinutes: 60,
    })
    const result = processSessionEnd(state, session)

    expect(result.newState.statGrowth.DEBUGGING).toBeGreaterThan(0)
    expect(result.newState.statGrowth.WISDOM).toBeGreaterThan(0)
    expect(result.newState.statGrowth.PATIENCE).toBeGreaterThan(0)
  })

  it('should assign custom title on ascension', () => {
    const state: EvolutionState = {
      ...createDefaultEvolutionState(),
      totalXP: 99_999_000,
      tier: 'elder',
    }
    const session = makeSession({ outputTokens: 100_000 })
    const result = processSessionEnd(state, session)
    expect(result.newState.tier).toBe('ascended')
    expect(result.newState.customTitle).toBe('The Ascended')
  })

  it('should not change tier when XP insufficient', () => {
    const state = createDefaultEvolutionState()
    const session = makeSession({ outputTokens: 100 })
    const result = processSessionEnd(state, session)
    expect(result.tierChanged).toBe(false)
    expect(result.newState.tier).toBe('hatchling')
  })

  it('should handle multiple sessions accumulating', () => {
    let state = createDefaultEvolutionState()

    // 10 sessions of 10K XP each = 100K → juvenile
    for (let i = 0; i < 10; i++) {
      const session = makeSession({
        outputTokens: 10_000,
        sessionDate: `2026-03-${String(20 + i).padStart(2, '0')}`,
      })
      const result = processSessionEnd(state, session)
      state = result.newState
    }

    expect(state.totalXP).toBeGreaterThanOrEqual(100_000)
    expect(state.tier).toBe('juvenile')
    expect(state.lifetimeStats.totalSessions).toBe(10)
  })
})
