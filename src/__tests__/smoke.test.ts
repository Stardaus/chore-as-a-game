import { describe, it, expect } from 'vitest';
import { SecurityVault } from '../services/SecurityVault';

describe('SecurityVault Smoke Test', () => {
  it('correctly verifies parent PIN', () => {
    expect(SecurityVault.verifyPin('1234', '1234')).toBe(true);
    expect(SecurityVault.verifyPin('1234', '9999')).toBe(false);
  });

  it('generates a valid math challenge', () => {
    const challenge = SecurityVault.generateMathChallenge();
    expect(challenge.text).toBeDefined();
    expect(typeof challenge.answer).toBe('number');
  });

  it('correctly verifies challenge answer', () => {
    expect(SecurityVault.verifyChallengeAnswer('42', 42)).toBe(true);
    expect(SecurityVault.verifyChallengeAnswer('40', 42)).toBe(false);
  });
});
