/**
 * Session metrics accumulator.
 * Tracks token throughput, tool calls, and usage events during a session.
 * Call finalize() at session end to get the SessionMetrics snapshot.
 */

import type { SessionMetrics } from './evolution-types.js'

export class SessionTracker {
  private outputTokens = 0
  private inputTokens = 0
  private toolCalls = 0
  private rejectedToolCalls = 0
  private fileEdits = 0
  private testRuns = 0
  private forceSnips = 0
  private contextResets = 0
  private startTime: number

  constructor() {
    this.startTime = Date.now()
  }

  recordOutputTokens(count: number): void {
    this.outputTokens += count
  }

  recordInputTokens(count: number): void {
    this.inputTokens += count
  }

  recordToolCall(rejected = false): void {
    this.toolCalls++
    if (rejected) {
      this.rejectedToolCalls++
    }
  }

  recordFileEdit(): void {
    this.fileEdits++
  }

  recordTestRun(): void {
    this.testRuns++
  }

  recordForceSnip(): void {
    this.forceSnips++
  }

  recordContextReset(): void {
    this.contextResets++
  }

  /**
   * Get current accumulated metrics (without finalizing).
   */
  getSnapshot(): SessionMetrics {
    const durationMs = Date.now() - this.startTime
    const durationMinutes = Math.floor(durationMs / 60000)

    return {
      outputTokens: this.outputTokens,
      inputTokens: this.inputTokens,
      toolCalls: this.toolCalls,
      rejectedToolCalls: this.rejectedToolCalls,
      sessionDurationMinutes: durationMinutes,
      fileEdits: this.fileEdits,
      testRuns: this.testRuns,
      forceSnips: this.forceSnips,
      contextResets: this.contextResets,
      sessionDate: new Date().toISOString().slice(0, 10),
    }
  }

  /**
   * Finalize the session and return metrics.
   * Stamps the duration and date.
   */
  finalize(): SessionMetrics {
    return this.getSnapshot()
  }

  /**
   * Reset the tracker for a new session.
   */
  reset(): void {
    this.outputTokens = 0
    this.inputTokens = 0
    this.toolCalls = 0
    this.rejectedToolCalls = 0
    this.fileEdits = 0
    this.testRuns = 0
    this.forceSnips = 0
    this.contextResets = 0
    this.startTime = Date.now()
  }
}
