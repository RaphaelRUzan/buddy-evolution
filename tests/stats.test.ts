import { describe, it, expect } from 'vitest'
import {
  calculateRawStatGrowth, applyDiminishingReturns, calculateStatGrowth, getEffectiveStat,
} from '../src/stats.js'
import type { SessionMetrics } from '../src/evolution-types.js'

function makeSession(overrides: Partial<SessionMetrics> = {}): SessionMetrics {
  return {
    outputTokens: 0, inputTokens: 0, toolCalls: 0, rejectedToolCalls: 0,
    sessionDurationMinutes: 0, fileEdits: 0, testRuns: 0,
    forceSnips: 0, contextResets: 0, sessionDate: '2026-03-31',
    ...overrides,
  }
}

describe('calculateRawStatGrowth', () => {
  it('DEBUGGING: driven by file edits and test runs', () => {
    const session = makeSession({ fileEdits: 10, testRuns: 5 })
    // (10*2 + 5*5) * 0.1 = (20 + 25) * 0.1 = 4.5
    expect(calculateRawStatGrowth('DEBUGGING', session)).toBeCloseTo(4.5)
  })

  it('DEBUGGING: zero with no edits or tests', () => {
    expect(calculateRawStatGrowth('DEBUGGING', makeSession())).toBe(0)
  })

  it('WISDOM: driven by input tokens', () => {
    const session = makeSession({ inputTokens: 100000 })
    // 100000 * 0.0001 = 10
    expect(calculateRawStatGrowth('WISDOM', session)).toBeCloseTo(10)
  })

  it('CHAOS: driven by rejected/total tool call ratio', () => {
    const session = makeSession({ toolCalls: 20, rejectedToolCalls: 5 })
    // (5/20) * 10 = 2.5
    expect(calculateRawStatGrowth('CHAOS', session)).toBeCloseTo(2.5)
  })

  it('CHAOS: handles zero tool calls gracefully', () => {
    const session = makeSession({ toolCalls: 0, rejectedToolCalls: 0 })
    // (0 / max(1,0)) * 10 = 0
    expect(calculateRawStatGrowth('CHAOS', session)).toBe(0)
  })

  it('PATIENCE: driven by session duration', () => {
    const session = makeSession({ sessionDurationMinutes: 60 })
    // 60 * 0.05 = 3.0
    expect(calculateRawStatGrowth('PATIENCE', session)).toBeCloseTo(3.0)
  })

  it('SNARK: driven by force-snips and context resets', () => {
    const session = makeSession({ forceSnips: 4, contextResets: 3 })
    // (4*3 + 3*2) * 0.2 = (12+6) * 0.2 = 3.6
    expect(calculateRawStatGrowth('SNARK', session)).toBeCloseTo(3.6)
  })
})

describe('applyDiminishingReturns', () => {
  it('should apply full growth when current is 0', () => {
    expect(applyDiminishingReturns(10, 0)).toBeCloseTo(10)
  })

  it('should halve growth when current is 100', () => {
    // 10 * (100 / 200) = 5
    expect(applyDiminishingReturns(10, 100)).toBeCloseTo(5)
  })

  it('should return ~10% growth when current is 900', () => {
    // 10 * (100 / 1000) = 1
    expect(applyDiminishingReturns(10, 900)).toBeCloseTo(1)
  })

  it('should return 0 for zero raw growth', () => {
    expect(applyDiminishingReturns(0, 50)).toBe(0)
  })

  it('should return 0 for negative raw growth', () => {
    expect(applyDiminishingReturns(-5, 50)).toBe(0)
  })

  it('should always be less than raw growth when current > 0', () => {
    const actual = applyDiminishingReturns(10, 1)
    expect(actual).toBeLessThan(10)
    expect(actual).toBeGreaterThan(0)
  })
})

describe('calculateStatGrowth', () => {
  it('should combine driver and diminishing returns', () => {
    const session = makeSession({ fileEdits: 10, testRuns: 5 })
    // Raw DEBUGGING = 4.5, with currentGrowth=0: actual = 4.5
    expect(calculateStatGrowth('DEBUGGING', session, 0)).toBeCloseTo(4.5)
  })

  it('should diminish growth for high current growth', () => {
    const session = makeSession({ fileEdits: 10, testRuns: 5 })
    const atZero = calculateStatGrowth('DEBUGGING', session, 0)
    const atHundred = calculateStatGrowth('DEBUGGING', session, 100)
    expect(atHundred).toBeLessThan(atZero)
    expect(atHundred).toBeCloseTo(atZero / 2)
  })
})

describe('getEffectiveStat', () => {
  it('should add growth to base stat', () => {
    expect(getEffectiveStat(50, 30)).toBe(80)
  })

  it('should cap at 200', () => {
    expect(getEffectiveStat(100, 150)).toBe(200)
  })

  it('should floor at 1', () => {
    expect(getEffectiveStat(1, -5)).toBe(1)
  })

  it('should round to nearest integer', () => {
    expect(getEffectiveStat(50, 10.7)).toBe(61)
  })
})
