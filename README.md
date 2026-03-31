# buddy-evolution

RPG-style evolution system for Claude Code's `/buddy` companion pet. Your pet grows based on actual token throughput — not RNG, not time gates, just how much you use Claude Code.

## The Pitch

The `/buddy` pet system generates a deterministic companion from your account ID — species, rarity, stats, cosmetics — all static, never changing. **What if it grew?**

Token throughput becomes XP. Tool calls earn bonus XP. Session streaks multiply gains. Your pet evolves from a Hatchling to an Ascended legendary form, and its stats reflect *your* actual usage patterns.

## Evolution Tiers

```
Hatchling (0 XP)        →  base sprite
Juvenile  (100K XP)     →  corner energy markers, bolder idle
Adult     (1M XP)       →  species-specific pattern overlay
Elder     (10M XP)      →  glowing aura border, shimmer animation
Ascended  (100M XP)     →  floating star particles, custom title
```

Each tier is cumulative — Ascended pets have patterns + aura + particles.

## XP Sources

| Source | Rate |
|--------|------|
| Output tokens | 1 XP per token |
| Input tokens | 0.5 XP per token |
| Tool calls | 100 XP each |
| Quest bonus (30+ min session) | 5,000 XP |
| Session streak | 1.0x → 2.0x multiplier (caps at day 11) |

**Example:** A heavy session — 50K output tokens, 10K input, 25 tool calls, 45 minutes, 5-day streak — earns **~84,000 XP** in one sitting.

## Usage-Driven Stats

Stats aren't random filler. They track how you actually work:

| Stat | Driven By |
|------|-----------|
| DEBUGGING | File edits + test runs |
| WISDOM | Cumulative input tokens |
| CHAOS | Rejected/retried tool call ratio |
| PATIENCE | Average session duration |
| SNARK | Force-snips, interrupts, context resets |

Growth uses **diminishing returns** — fast early gains, asymptotic near the soft cap. Base stats (1-100 from bones) can push up to 200 with evolution.

## Architecture

Evolution is **purely additive** — the deterministic bone generation (species, rarity, base stats from account ID) is never touched. Everything layers on top.

```
src/
├── types.ts              # Mirrored base types (CompanionBones, Species, etc.)
├── companion.ts          # Deterministic generation (Mulberry32/FNV-1a)
├── sprites.ts            # Base sprite rendering (18 species x 3 frames)
├── evolution-types.ts    # EvolutionTier, EvolutionState, SessionMetrics
├── xp.ts                 # XP calculation engine
├── stats.ts              # Usage-driven stat growth with diminishing returns
├── evolution.ts          # Core orchestrator — processSessionEnd()
├── evolution-sprites.ts  # Tier-aware additive sprite overlays
├── evolution-store.ts    # Persistence (soul file integration)
└── session-tracker.ts    # Session metrics accumulator
```

## Running

```bash
npm install
npm test        # 104 tests across 7 suites
```

## How It Would Integrate

The evolution engine hooks into session lifecycle:

```typescript
import { SessionTracker } from './session-tracker'
import { processSessionEnd } from './evolution'
import { loadEvolutionState, saveEvolutionState } from './evolution-store'

// Start of session
const tracker = new SessionTracker()

// During session (from telemetry events)
tracker.recordOutputTokens(count)
tracker.recordToolCall(rejected)
tracker.recordFileEdit()

// End of session
const metrics = tracker.finalize()
const currentState = loadEvolutionState(soulFilePath)
const { newState, tierChanged, xpGained } = processSessionEnd(currentState, metrics)
saveEvolutionState(soulFilePath, newState)

if (tierChanged) {
  // Show evolution animation!
}
```

## Design Decisions

- **Stats update at session end**, not per-token — no performance overhead
- **Backwards compatible** — missing `evolution` field in soul file returns default hatchling
- **Sprite overlays are additive** — no need for 90 new sprite definitions (18 species x 5 tiers)
- **Streak resets on 2-day gap** — forgiving but not trivial
- **XP multiplier caps at 2x** — rewards consistency without runaway scaling

## License

MIT
