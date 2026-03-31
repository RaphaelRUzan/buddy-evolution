/**
 * Mirrored deterministic companion generation from account ID.
 * Faithful reproduction of the original Mulberry32 PRNG seeded from FNV-1a hash.
 * Species, rarity, stats are all deterministic and never change.
 */

import {
  type CompanionBones, type Species, type Eye, type Hat, type Rarity, type Stats, type StatName,
  SPECIES, EYES, HATS, STAT_NAMES, RARITY_WEIGHTS, COMPANION_SALT,
} from './types.js'

// --- FNV-1a hash (matches original) ---

function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5 // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) // FNV prime
  }
  return hash >>> 0 // unsigned 32-bit
}

// --- Mulberry32 PRNG (matches original) ---

function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- Deterministic roll ---

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function rollRarity(rand: () => number): { rarity: Rarity; statFloor: number } {
  const roll = rand()
  let cumulative = 0
  for (const entry of RARITY_WEIGHTS) {
    cumulative += entry.weight
    if (roll < cumulative) {
      return { rarity: entry.rarity, statFloor: entry.statFloor }
    }
  }
  return { rarity: 'common', statFloor: 5 }
}

function rollStats(rand: () => number, statFloor: number): Stats {
  const names = [...STAT_NAMES]
  // Shuffle to pick peak and dump stats
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]]
  }

  const stats = {} as Record<StatName, number>

  // Peak stat: floor + 50 + random(0-30)
  stats[names[0]] = Math.min(100, statFloor + 50 + Math.floor(rand() * 31))

  // Dump stat: max(1, floor - 10 + random(0-15))
  stats[names[1]] = Math.max(1, statFloor - 10 + Math.floor(rand() * 16))

  // Scatter stats: floor + random(0-40)
  for (let i = 2; i < names.length; i++) {
    stats[names[i]] = Math.min(100, statFloor + Math.floor(rand() * 41))
  }

  return stats
}

// --- Cache ---

const rollCache = new Map<string, CompanionBones>()

// --- Public API ---

export function rollCompanionBones(userId: string): CompanionBones {
  const cached = rollCache.get(userId)
  if (cached) return cached

  const hash = fnv1aHash(userId + COMPANION_SALT)
  const rand = mulberry32(hash)

  const species = pick(SPECIES, rand)
  const { rarity, statFloor } = rollRarity(rand)
  const eye = pick(EYES, rand)
  const hat = pick(HATS, rand)
  const shiny = rand() < 0.01
  const stats = rollStats(rand, statFloor)
  const inspirationSeed = Math.floor(rand() * 1e9)

  const bones: CompanionBones = { rarity, species, eye, hat, shiny, stats, inspirationSeed }
  rollCache.set(userId, bones)
  return bones
}

export function clearRollCache(): void {
  rollCache.clear()
}

// Re-export for convenience
export { fnv1aHash, mulberry32 }
