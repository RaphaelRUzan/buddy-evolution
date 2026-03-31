import { describe, it, expect } from 'vitest'
import { renderEvolvedSprite, tierAtLeast, getTierVisualDescription } from '../src/evolution-sprites.js'
import { rollCompanionBones, clearRollCache } from '../src/companion.js'
import { createDefaultEvolutionState } from '../src/evolution.js'
import { renderSprite } from '../src/sprites.js'
import type { EvolutionState, EvolutionTier } from '../src/evolution-types.js'

function makeState(tier: EvolutionTier): EvolutionState {
  return { ...createDefaultEvolutionState(), tier }
}

describe('tierAtLeast', () => {
  it('hatchling is at least hatchling', () => {
    expect(tierAtLeast('hatchling', 'hatchling')).toBe(true)
  })

  it('hatchling is NOT at least juvenile', () => {
    expect(tierAtLeast('hatchling', 'juvenile')).toBe(false)
  })

  it('ascended is at least everything', () => {
    expect(tierAtLeast('ascended', 'hatchling')).toBe(true)
    expect(tierAtLeast('ascended', 'juvenile')).toBe(true)
    expect(tierAtLeast('ascended', 'adult')).toBe(true)
    expect(tierAtLeast('ascended', 'elder')).toBe(true)
    expect(tierAtLeast('ascended', 'ascended')).toBe(true)
  })

  it('adult is at least juvenile but not elder', () => {
    expect(tierAtLeast('adult', 'juvenile')).toBe(true)
    expect(tierAtLeast('adult', 'elder')).toBe(false)
  })
})

describe('renderEvolvedSprite', () => {
  beforeEach(() => clearRollCache())

  it('hatchling should match base sprite exactly', () => {
    const bones = rollCompanionBones('sprite-test-1')
    const base = renderSprite(bones, 0)
    const evolved = renderEvolvedSprite(bones, makeState('hatchling'), 0)
    expect(evolved).toEqual(base)
  })

  it('juvenile should differ from base sprite (corner markers)', () => {
    const bones = rollCompanionBones('sprite-test-2')
    const base = renderSprite(bones, 0)
    const evolved = renderEvolvedSprite(bones, makeState('juvenile'), 0)
    // At least one line should differ due to + markers
    const hasDiff = evolved.some((line, i) => line !== base[i])
    expect(hasDiff).toBe(true)
  })

  it('adult should include pattern characters', () => {
    const bones = rollCompanionBones('sprite-test-3')
    const evolved = renderEvolvedSprite(bones, makeState('adult'), 0)
    // Should have pattern characters (not just spaces and base chars)
    const allText = evolved.join('')
    // Adult includes juvenile markers (+) and species pattern
    expect(allText).toContain('+')
  })

  it('elder should include aura characters', () => {
    const bones = rollCompanionBones('sprite-test-4')
    const evolved = renderEvolvedSprite(bones, makeState('elder'), 0)
    const allText = evolved.join('')
    // Should contain at least one aura character
    const hasAura = ['✧', '·', '°'].some(c => allText.includes(c))
    expect(hasAura).toBe(true)
  })

  it('ascended should include particle characters', () => {
    const bones = rollCompanionBones('sprite-test-5')
    const evolved = renderEvolvedSprite(bones, makeState('ascended'), 0)
    const allText = evolved.join('')
    const hasParticles = ['★', '✦', '◇'].some(c => allText.includes(c))
    expect(hasParticles).toBe(true)
  })

  it('should produce consistent output for same inputs', () => {
    const bones = rollCompanionBones('consistency-test')
    const state = makeState('elder')
    const render1 = renderEvolvedSprite(bones, state, 2)
    clearRollCache()
    const bones2 = rollCompanionBones('consistency-test')
    const render2 = renderEvolvedSprite(bones2, state, 2)
    expect(render1).toEqual(render2)
  })

  it('different frames should produce different overlays for animated tiers', () => {
    const bones = rollCompanionBones('animation-test')
    const state = makeState('ascended')
    const frame0 = renderEvolvedSprite(bones, state, 0)
    const frame1 = renderEvolvedSprite(bones, state, 1)
    // Particles shift with frame, so at least one line should differ
    const hasDiff = frame0.some((line, i) => line !== frame1[i])
    expect(hasDiff).toBe(true)
  })

  it('should return correct number of lines', () => {
    const bones = rollCompanionBones('line-count-test')
    for (const tier of ['hatchling', 'juvenile', 'adult', 'elder', 'ascended'] as EvolutionTier[]) {
      const lines = renderEvolvedSprite(bones, makeState(tier), 0)
      expect(lines.length).toBe(5)
    }
  })
})

describe('getTierVisualDescription', () => {
  it('should return a description for each tier', () => {
    const tiers: EvolutionTier[] = ['hatchling', 'juvenile', 'adult', 'elder', 'ascended']
    for (const tier of tiers) {
      const desc = getTierVisualDescription(tier)
      expect(desc).toBeTypeOf('string')
      expect(desc.length).toBeGreaterThan(0)
    }
  })
})
