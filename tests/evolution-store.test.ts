import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadEvolutionState, saveEvolutionState, loadStoredCompanion } from '../src/evolution-store.js'
import { createDefaultEvolutionState } from '../src/evolution.js'
import type { EvolutionState, StoredCompanionWithEvolution } from '../src/evolution-types.js'

const TEST_DIR = join(tmpdir(), 'buddy-evolution-test-' + Date.now())
let testFile: string

beforeEach(() => {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true })
  testFile = join(TEST_DIR, `test-${Math.random().toString(36).slice(2)}.json`)
})

afterEach(() => {
  if (existsSync(testFile)) {
    try { unlinkSync(testFile) } catch { /* ignore */ }
  }
})

describe('loadEvolutionState', () => {
  it('should return default state when file does not exist', () => {
    const state = loadEvolutionState('/nonexistent/path.json')
    expect(state.totalXP).toBe(0)
    expect(state.tier).toBe('hatchling')
  })

  it('should return default state when evolution field is missing', () => {
    const data: StoredCompanionWithEvolution = {
      name: 'Sparky', personality: 'cheerful', hatchedAt: 1000,
    }
    writeFileSync(testFile, JSON.stringify(data))
    const state = loadEvolutionState(testFile)
    expect(state.totalXP).toBe(0)
    expect(state.tier).toBe('hatchling')
  })

  it('should load existing evolution state', () => {
    const evoState: EvolutionState = {
      ...createDefaultEvolutionState(),
      totalXP: 250_000,
      tier: 'juvenile',
    }
    const data: StoredCompanionWithEvolution = {
      name: 'Sparky', personality: 'cheerful', hatchedAt: 1000,
      evolution: evoState,
    }
    writeFileSync(testFile, JSON.stringify(data))
    const loaded = loadEvolutionState(testFile)
    expect(loaded.totalXP).toBe(250_000)
    expect(loaded.tier).toBe('juvenile')
  })

  it('should handle corrupted JSON gracefully', () => {
    writeFileSync(testFile, '{invalid json}}}')
    const state = loadEvolutionState(testFile)
    expect(state.totalXP).toBe(0)
    expect(state.tier).toBe('hatchling')
  })
})

describe('saveEvolutionState', () => {
  it('should create file with evolution state', () => {
    const state: EvolutionState = {
      ...createDefaultEvolutionState(),
      totalXP: 500_000,
      tier: 'adult',
    }
    saveEvolutionState(testFile, state)
    const loaded = loadEvolutionState(testFile)
    expect(loaded.totalXP).toBe(500_000)
    expect(loaded.tier).toBe('adult')
  })

  it('should preserve existing soul fields', () => {
    const existing: StoredCompanionWithEvolution = {
      name: 'Pixel', personality: 'mischievous', hatchedAt: 9999,
    }
    writeFileSync(testFile, JSON.stringify(existing))

    const state = createDefaultEvolutionState()
    state.totalXP = 1000
    saveEvolutionState(testFile, state)

    const companion = loadStoredCompanion(testFile)
    expect(companion?.name).toBe('Pixel')
    expect(companion?.personality).toBe('mischievous')
    expect(companion?.hatchedAt).toBe(9999)
    expect(companion?.evolution?.totalXP).toBe(1000)
  })

  it('should round-trip evolution state accurately', () => {
    const state: EvolutionState = {
      totalXP: 12_345_678,
      tier: 'elder',
      lifetimeStats: {
        totalOutputTokens: 5_000_000,
        totalInputTokens: 3_000_000,
        totalToolCalls: 15000,
        totalSessions: 200,
        totalSessionMinutes: 6000,
        rejectedToolCalls: 500,
        forceSnips: 20,
        contextResets: 10,
        fileEdits: 8000,
        testRuns: 3000,
      },
      streak: { currentDays: 7, lastSessionDate: '2026-03-31' },
      statGrowth: {
        DEBUGGING: 45.5,
        PATIENCE: 30.2,
        CHAOS: 12.8,
        WISDOM: 55.1,
        SNARK: 8.3,
      },
      customTitle: undefined,
      evolvedAt: {
        hatchling: null,
        juvenile: 1700000000000,
        adult: 1700100000000,
        elder: 1700200000000,
        ascended: null,
      },
    }

    saveEvolutionState(testFile, state)
    const loaded = loadEvolutionState(testFile)

    expect(loaded.totalXP).toBe(state.totalXP)
    expect(loaded.tier).toBe(state.tier)
    expect(loaded.lifetimeStats.totalOutputTokens).toBe(5_000_000)
    expect(loaded.streak.currentDays).toBe(7)
    expect(loaded.statGrowth.DEBUGGING).toBeCloseTo(45.5)
    expect(loaded.evolvedAt.juvenile).toBe(1700000000000)
    expect(loaded.evolvedAt.ascended).toBeNull()
  })
})

describe('loadStoredCompanion', () => {
  it('should return null for nonexistent file', () => {
    expect(loadStoredCompanion('/nonexistent.json')).toBeNull()
  })

  it('should return null for corrupted file', () => {
    writeFileSync(testFile, 'not json')
    expect(loadStoredCompanion(testFile)).toBeNull()
  })

  it('should load full companion data', () => {
    const data: StoredCompanionWithEvolution = {
      name: 'Buddy', personality: 'loyal', hatchedAt: 123,
      evolution: createDefaultEvolutionState(),
    }
    writeFileSync(testFile, JSON.stringify(data))
    const loaded = loadStoredCompanion(testFile)
    expect(loaded?.name).toBe('Buddy')
    expect(loaded?.evolution?.tier).toBe('hatchling')
  })
})
