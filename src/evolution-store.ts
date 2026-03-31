/**
 * Persistence layer for evolution state.
 * Stores evolution data alongside the existing soul file.
 * Backwards-compatible: missing evolution field returns default state.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import type { EvolutionState, StoredCompanionWithEvolution } from './evolution-types.js'
import { createDefaultEvolutionState } from './evolution.js'

/**
 * Load evolution state from a companion soul file.
 * Returns default hatchling state if file doesn't exist or evolution field is missing.
 */
export function loadEvolutionState(filePath: string): EvolutionState {
  if (!existsSync(filePath)) {
    return createDefaultEvolutionState()
  }

  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data: StoredCompanionWithEvolution = JSON.parse(raw)

    if (!data.evolution) {
      return createDefaultEvolutionState()
    }

    return data.evolution
  } catch {
    return createDefaultEvolutionState()
  }
}

/**
 * Save evolution state to a companion soul file.
 * Preserves existing soul fields (name, personality, hatchedAt).
 */
export function saveEvolutionState(filePath: string, state: EvolutionState): void {
  let existing: StoredCompanionWithEvolution = {
    name: '',
    personality: '',
    hatchedAt: 0,
  }

  if (existsSync(filePath)) {
    try {
      const raw = readFileSync(filePath, 'utf-8')
      existing = JSON.parse(raw)
    } catch {
      // If file is corrupted, start fresh but preserve evolution
    }
  }

  const updated: StoredCompanionWithEvolution = {
    ...existing,
    evolution: state,
  }

  writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
}

/**
 * Load the full stored companion data (soul + evolution).
 */
export function loadStoredCompanion(filePath: string): StoredCompanionWithEvolution | null {
  if (!existsSync(filePath)) return null

  try {
    const raw = readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}
