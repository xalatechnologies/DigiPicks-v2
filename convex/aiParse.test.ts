/// <reference types="vite/client" />
import { describe, expect, test } from 'vitest';
import { parseAnalysis } from './shared/aiParse';

describe('parseAnalysis', () => {
  test('parses a clean JSON object', () => {
    const raw = JSON.stringify({
      summary: 'Sharp side on the under, recent pace tells the story.',
      confidence: 72,
      reasoning: 'Both teams below pace baseline; Murray on a back-to-back.',
    });
    const result = parseAnalysis(raw);
    expect(result.summary).toContain('Sharp side');
    expect(result.confidence).toBe(72);
    expect(result.reasoning).toContain('Murray');
  });

  test('tolerates leading and trailing prose around the JSON', () => {
    const raw = `Here is the analysis:
{"summary": "Tight call", "confidence": 55, "reasoning": "balanced."}
Hope that helps.`;
    const result = parseAnalysis(raw);
    expect(result.summary).toBe('Tight call');
    expect(result.confidence).toBe(55);
  });

  test('clamps confidence to [0,100] and rounds floats', () => {
    expect(
      parseAnalysis(
        JSON.stringify({ summary: 's', confidence: 150, reasoning: 'r' }),
      ).confidence,
    ).toBe(100);
    expect(
      parseAnalysis(
        JSON.stringify({ summary: 's', confidence: -10, reasoning: 'r' }),
      ).confidence,
    ).toBe(0);
    expect(
      parseAnalysis(
        JSON.stringify({ summary: 's', confidence: 67.4, reasoning: 'r' }),
      ).confidence,
    ).toBe(67);
  });

  test('truncates oversize summary and reasoning', () => {
    const longSummary = 'x'.repeat(500);
    const longReasoning = 'y'.repeat(2000);
    const result = parseAnalysis(
      JSON.stringify({
        summary: longSummary,
        confidence: 50,
        reasoning: longReasoning,
      }),
    );
    expect(result.summary.length).toBe(280);
    expect(result.reasoning.length).toBe(1200);
  });

  test('throws when no JSON object is present', () => {
    expect(() => parseAnalysis('No braces here at all')).toThrow(
      'did not contain a JSON object',
    );
  });

  test('throws when required fields are missing', () => {
    expect(() =>
      parseAnalysis(JSON.stringify({ summary: 's', confidence: 50 })),
    ).toThrow('Missing reasoning');
    expect(() =>
      parseAnalysis(JSON.stringify({ confidence: 50, reasoning: 'r' })),
    ).toThrow('Missing summary');
    expect(() =>
      parseAnalysis(JSON.stringify({ summary: 's', reasoning: 'r' })),
    ).toThrow('Missing confidence');
  });

  test('trims whitespace from string fields', () => {
    const result = parseAnalysis(
      JSON.stringify({
        summary: '   padded summary   ',
        confidence: 60,
        reasoning: '\n\nleading newlines\n',
      }),
    );
    expect(result.summary).toBe('padded summary');
    expect(result.reasoning).toBe('leading newlines');
  });
});
