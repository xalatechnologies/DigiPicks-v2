// =============================================================================
// AI response parsing — pure utilities, separable from the Anthropic action
// so they can be unit-tested without touching the network.
// =============================================================================

export interface AnalysisResult {
  summary: string;
  confidence: number;
  reasoning: string;
}

/**
 * Pull the first JSON object out of a model response and normalize it
 * into an {@link AnalysisResult}. Defensive against:
 *   - leading / trailing prose
 *   - confidence values outside 0–100
 *   - unbounded summary / reasoning lengths
 *
 * Throws if no JSON object is present or any required field is missing.
 */
export function parseAnalysis(raw: string): AnalysisResult {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain a JSON object');
  }
  const json = raw.slice(start, end + 1);
  const parsed = JSON.parse(json) as Partial<AnalysisResult>;
  if (typeof parsed.summary !== 'string') throw new Error('Missing summary');
  if (typeof parsed.confidence !== 'number') throw new Error('Missing confidence');
  if (typeof parsed.reasoning !== 'string') throw new Error('Missing reasoning');
  return {
    summary: parsed.summary.trim().slice(0, 280),
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence))),
    reasoning: parsed.reasoning.trim().slice(0, 1200),
  };
}
