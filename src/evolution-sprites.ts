/**
 * Tier-aware sprite overlay system.
 * Applies additive visual effects based on evolution tier.
 * Never modifies the base sprite — overlays are composited on top.
 *
 * Pipeline: renderSprite → applyPattern → applyAura → applyParticles
 */

import type { CompanionBones, Species } from './types.js'
import type { EvolutionState, EvolutionTier } from './evolution-types.js'
import { renderSprite, SPRITE_WIDTH, SPRITE_HEIGHT } from './sprites.js'

// --- Species-specific pattern characters ---

const SPECIES_PATTERNS: Partial<Record<Species, string>> = {
  duck: '~',
  goose: '~',
  dragon: '*',
  turtle: '#',
  octopus: '~',
  cat: '.',
  ghost: '`',
  robot: '+',
  penguin: '.',
  axolotl: '~',
  snail: '.',
  cactus: '*',
}

const DEFAULT_PATTERN = '.'

// --- Aura characters (cycle per frame) ---

const AURA_CHARS = ['✧', '·', '°', '✧', '·', '°']

// --- Particle characters (float above sprite) ---

const PARTICLE_CHARS = ['★', '✦', '◇', '·', '°']

// --- Overlay: Juvenile (corner markers) ---

function applyJuvenileOverlay(lines: string[]): string[] {
  const result = [...lines]
  // Add + markers at corners of the sprite body (lines 1 and 3)
  if (result.length >= 4) {
    result[1] = '+' + result[1].slice(1, -1) + '+'
    result[3] = '+' + result[3].slice(1, -1) + '+'
  }
  return result
}

// --- Overlay: Adult (pattern fill in empty spaces near body) ---

function applyPatternOverlay(lines: string[], species: Species): string[] {
  const patternChar = SPECIES_PATTERNS[species] ?? DEFAULT_PATTERN
  return lines.map((line, i) => {
    if (i === 0) return line // skip hat line
    const chars = [...line]
    for (let j = 0; j < chars.length; j++) {
      // Fill spaces that are adjacent to non-space characters
      if (chars[j] === ' ') {
        const hasNeighbor = (j > 0 && chars[j - 1] !== ' ') || (j < chars.length - 1 && chars[j + 1] !== ' ')
        if (hasNeighbor) {
          chars[j] = patternChar
        }
      }
    }
    return chars.join('')
  })
}

// --- Overlay: Elder (aura border) ---

function applyAuraOverlay(lines: string[], frame: number): string[] {
  const auraL = AURA_CHARS[frame % AURA_CHARS.length]
  const auraR = AURA_CHARS[(frame + 3) % AURA_CHARS.length]

  return lines.map((line, i) => {
    if (i === 0) return line // skip hat line
    // Add aura characters on left and right edges
    const trimmed = line.length >= SPRITE_WIDTH
      ? auraL + line.slice(1, -1) + auraR
      : auraL + line.padEnd(SPRITE_WIDTH - 2).slice(0, SPRITE_WIDTH - 2) + auraR
    return trimmed
  })
}

// --- Overlay: Ascended (particles above sprite) ---

function applyParticleOverlay(lines: string[], frame: number): string[] {
  // Generate a particle line above the sprite
  const particleLine = Array(SPRITE_WIDTH).fill(' ')

  // Place 2-3 particles at positions that shift with frame
  const positions = [
    (frame * 2 + 1) % SPRITE_WIDTH,
    (frame * 3 + 5) % SPRITE_WIDTH,
    (frame * 5 + 8) % SPRITE_WIDTH,
  ]
  positions.forEach((pos, i) => {
    particleLine[pos] = PARTICLE_CHARS[i % PARTICLE_CHARS.length]
  })

  // Prepend particle line, keep sprite height by not adding to bottom
  return [particleLine.join(''), ...lines.slice(0, SPRITE_HEIGHT - 1)]
}

// --- Main renderer ---

/**
 * Render a sprite with tier-appropriate evolution overlays.
 *
 * Overlay pipeline (cumulative — higher tiers include all lower effects):
 * - Hatchling: base sprite only
 * - Juvenile: + corner markers
 * - Adult: + species pattern fill (includes Juvenile markers)
 * - Elder: + aura border (includes all above)
 * - Ascended: + floating particles (includes all above)
 */
export function renderEvolvedSprite(
  bones: CompanionBones,
  state: EvolutionState,
  frame: number,
): string[] {
  let lines = renderSprite(bones, frame)

  const tier = state.tier

  // Apply overlays cumulatively
  if (tierAtLeast(tier, 'juvenile')) {
    lines = applyJuvenileOverlay(lines)
  }
  if (tierAtLeast(tier, 'adult')) {
    lines = applyPatternOverlay(lines, bones.species)
  }
  if (tierAtLeast(tier, 'elder')) {
    lines = applyAuraOverlay(lines, frame)
  }
  if (tierAtLeast(tier, 'ascended')) {
    lines = applyParticleOverlay(lines, frame)
  }

  return lines
}

/**
 * Check if a tier is at least as high as the target tier.
 */
const TIER_RANKS: Record<EvolutionTier, number> = {
  hatchling: 0,
  juvenile: 1,
  adult: 2,
  elder: 3,
  ascended: 4,
}

export function tierAtLeast(tier: EvolutionTier, target: EvolutionTier): boolean {
  return TIER_RANKS[tier] >= TIER_RANKS[target]
}

/**
 * Get a description of the visual effects for a given tier.
 */
export function getTierVisualDescription(tier: EvolutionTier): string {
  switch (tier) {
    case 'hatchling': return 'Base form'
    case 'juvenile': return 'Growing stronger — corner energy markers'
    case 'adult': return 'Mature form — species pattern aura'
    case 'elder': return 'Ancient power — glowing aura border'
    case 'ascended': return 'Transcendent — floating star particles'
  }
}
