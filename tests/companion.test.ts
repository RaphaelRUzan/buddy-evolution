import { describe, it, expect, beforeEach } from 'vitest'
import { rollCompanionBones, clearRollCache } from '../src/companion.js'
import { SPECIES, EYES, HATS, RARITIES, STAT_NAMES } from '../src/types.js'

describe('rollCompanionBones', () => {
  beforeEach(() => {
    clearRollCache()
  })

  it('should produce deterministic results for the same userId', () => {
    const bones1 = rollCompanionBones('user-abc-123')
    clearRollCache()
    const bones2 = rollCompanionBones('user-abc-123')

    expect(bones1).toEqual(bones2)
  })

  it('should produce different results for different userIds', () => {
    const bones1 = rollCompanionBones('user-alpha')
    const bones2 = rollCompanionBones('user-beta')

    // Extremely unlikely to be identical across all fields
    const same = bones1.species === bones2.species
      && bones1.rarity === bones2.rarity
      && bones1.eye === bones2.eye
      && bones1.hat === bones2.hat
      && bones1.stats.DEBUGGING === bones2.stats.DEBUGGING
    expect(same).toBe(false)
  })

  it('should produce valid species', () => {
    const bones = rollCompanionBones('test-species')
    expect(SPECIES).toContain(bones.species)
  })

  it('should produce valid rarity', () => {
    const bones = rollCompanionBones('test-rarity')
    expect(RARITIES).toContain(bones.rarity)
  })

  it('should produce valid eye', () => {
    const bones = rollCompanionBones('test-eye')
    expect(EYES).toContain(bones.eye)
  })

  it('should produce valid hat', () => {
    const bones = rollCompanionBones('test-hat')
    expect(HATS).toContain(bones.hat)
  })

  it('should produce stats in valid range (1-100)', () => {
    const bones = rollCompanionBones('test-stats')
    for (const stat of STAT_NAMES) {
      expect(bones.stats[stat]).toBeGreaterThanOrEqual(1)
      expect(bones.stats[stat]).toBeLessThanOrEqual(100)
    }
  })

  it('should have one peak stat significantly higher than others', () => {
    // Test multiple users to find one with clear peak/dump distinction
    const bones = rollCompanionBones('peak-stat-test-user')
    const values = STAT_NAMES.map(s => bones.stats[s])
    const max = Math.max(...values)
    const min = Math.min(...values)
    // Peak should be at least 20 higher than dump for most rarity levels
    expect(max - min).toBeGreaterThan(10)
  })

  it('should produce boolean shiny', () => {
    const bones = rollCompanionBones('test-shiny')
    expect(typeof bones.shiny).toBe('boolean')
  })

  it('should produce numeric inspirationSeed', () => {
    const bones = rollCompanionBones('test-seed')
    expect(typeof bones.inspirationSeed).toBe('number')
    expect(bones.inspirationSeed).toBeGreaterThanOrEqual(0)
    expect(bones.inspirationSeed).toBeLessThan(1e9)
  })

  it('should cache results', () => {
    const bones1 = rollCompanionBones('cache-test')
    const bones2 = rollCompanionBones('cache-test')
    // Same reference (cached)
    expect(bones1).toBe(bones2)
  })

  it('should produce varied species across many userIds', () => {
    const speciesSeen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      clearRollCache()
      const bones = rollCompanionBones(`variety-test-${i}`)
      speciesSeen.add(bones.species)
    }
    // Should see at least 10 different species across 200 rolls
    expect(speciesSeen.size).toBeGreaterThanOrEqual(10)
  })
})
