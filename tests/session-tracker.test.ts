import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SessionTracker } from '../src/session-tracker.js'

describe('SessionTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-31T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with zero metrics', () => {
    const tracker = new SessionTracker()
    const metrics = tracker.getSnapshot()
    expect(metrics.outputTokens).toBe(0)
    expect(metrics.inputTokens).toBe(0)
    expect(metrics.toolCalls).toBe(0)
    expect(metrics.rejectedToolCalls).toBe(0)
    expect(metrics.fileEdits).toBe(0)
    expect(metrics.testRuns).toBe(0)
    expect(metrics.forceSnips).toBe(0)
    expect(metrics.contextResets).toBe(0)
  })

  it('should accumulate output tokens', () => {
    const tracker = new SessionTracker()
    tracker.recordOutputTokens(500)
    tracker.recordOutputTokens(300)
    expect(tracker.getSnapshot().outputTokens).toBe(800)
  })

  it('should accumulate input tokens', () => {
    const tracker = new SessionTracker()
    tracker.recordInputTokens(1000)
    tracker.recordInputTokens(2000)
    expect(tracker.getSnapshot().inputTokens).toBe(3000)
  })

  it('should count tool calls', () => {
    const tracker = new SessionTracker()
    tracker.recordToolCall()
    tracker.recordToolCall()
    tracker.recordToolCall(true) // rejected
    const metrics = tracker.getSnapshot()
    expect(metrics.toolCalls).toBe(3)
    expect(metrics.rejectedToolCalls).toBe(1)
  })

  it('should count file edits', () => {
    const tracker = new SessionTracker()
    tracker.recordFileEdit()
    tracker.recordFileEdit()
    expect(tracker.getSnapshot().fileEdits).toBe(2)
  })

  it('should count test runs', () => {
    const tracker = new SessionTracker()
    tracker.recordTestRun()
    expect(tracker.getSnapshot().testRuns).toBe(1)
  })

  it('should count force snips and context resets', () => {
    const tracker = new SessionTracker()
    tracker.recordForceSnip()
    tracker.recordForceSnip()
    tracker.recordContextReset()
    const metrics = tracker.getSnapshot()
    expect(metrics.forceSnips).toBe(2)
    expect(metrics.contextResets).toBe(1)
  })

  it('should calculate session duration in minutes', () => {
    const tracker = new SessionTracker()
    // Advance 45 minutes
    vi.advanceTimersByTime(45 * 60 * 1000)
    const metrics = tracker.finalize()
    expect(metrics.sessionDurationMinutes).toBe(45)
  })

  it('should stamp session date', () => {
    const tracker = new SessionTracker()
    const metrics = tracker.finalize()
    expect(metrics.sessionDate).toBe('2026-03-31')
  })

  it('should reset all metrics', () => {
    const tracker = new SessionTracker()
    tracker.recordOutputTokens(5000)
    tracker.recordToolCall()
    tracker.recordFileEdit()
    tracker.reset()
    const metrics = tracker.getSnapshot()
    expect(metrics.outputTokens).toBe(0)
    expect(metrics.toolCalls).toBe(0)
    expect(metrics.fileEdits).toBe(0)
  })

  it('finalize should produce same result as getSnapshot', () => {
    const tracker = new SessionTracker()
    tracker.recordOutputTokens(1000)
    tracker.recordInputTokens(500)
    tracker.recordToolCall()
    const snapshot = tracker.getSnapshot()
    const finalized = tracker.finalize()
    expect(finalized.outputTokens).toBe(snapshot.outputTokens)
    expect(finalized.inputTokens).toBe(snapshot.inputTokens)
    expect(finalized.toolCalls).toBe(snapshot.toolCalls)
  })
})
