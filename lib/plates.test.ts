import { describe, it, expect } from 'vitest';
import { calculatePlates, formatPlateLoading, findNearestAchievable, DEFAULT_PLATES, DEFAULT_BAR_WEIGHT } from './plates';

describe('Plate Calculator', () => {
  describe('calculatePlates', () => {
    it('calculates exact weight with standard plates', () => {
      const result = calculatePlates(60, 20, DEFAULT_PLATES);
      
      expect(result.reachable).toBe(true);
      expect(result.totalWeight).toBe(60);
      expect(result.totalPerSide).toBe(20);
      expect(result.perSide).toEqual({ 20: 1 });
      expect(result.needsMicroplates).toBe(false);
    });

    it('handles 57.5kg with microplates', () => {
      const result = calculatePlates(57.5, 20, DEFAULT_PLATES);
      
      expect(result.reachable).toBe(true);
      expect(result.totalWeight).toBe(57.5);
      expect(result.totalPerSide).toBe(18.75);
      // Greedy uses 15 instead of 10+5 (both equal 15 but greedy prefers fewer plates)
      expect(result.perSide).toEqual({ 15: 1, 2.5: 1, 1.25: 1 });
      expect(result.needsMicroplates).toBe(true);
    });

    it('handles empty bar (20kg target)', () => {
      const result = calculatePlates(20, 20, DEFAULT_PLATES);
      
      expect(result.reachable).toBe(true);
      expect(result.totalWeight).toBe(20);
      expect(result.totalPerSide).toBe(0);
      expect(result.perSide).toEqual({});
      expect(result.needsMicroplates).toBe(false);
    });

    it('handles light squat day (50% of volume)', () => {
      // e.g., 50% of 100kg = 50kg
      const result = calculatePlates(50, 20, DEFAULT_PLATES);
      
      expect(result.reachable).toBe(true);
      expect(result.totalWeight).toBe(50);
      expect(result.totalPerSide).toBe(15);
      expect(result.perSide).toEqual({ 15: 1 });
    });

    it('rounds down when plates unavailable', () => {
      // Try to load 57.5 without 1.25kg plates
      const platesWithout125 = [25, 20, 15, 10, 5, 2.5, 0.5];
      const result = calculatePlates(57.5, 20, platesWithout125);
      
      expect(result.reachable).toBe(false);
      // Without 1.25 plates: 15+2.5+0.5 = 18, total = 20 + 36 = 56 (or 15+3 = 18.5 = 57)
      expect(result.totalWeight).toBe(57); // 20 + 2×(15+2.5) = 57
      expect(result.roundedTo).toBe(57);
    });

    it('handles unreachable target without microplates', () => {
      // Try to load 57.5 without any plates < 2.5
      const platesWithoutMicro = [25, 20, 15, 10, 5, 2.5];
      const result = calculatePlates(57.5, 20, platesWithoutMicro);
      
      expect(result.reachable).toBe(false);
      // Without microplates: 15+2.5 = 17.5, total = 20 + 35 = 55
      expect(result.totalWeight).toBe(55); // 20 + 2×(15+2.5) = 55
      expect(result.roundedTo).toBe(55);
    });

    it('handles target below bar weight', () => {
      const result = calculatePlates(15, 20, DEFAULT_PLATES);
      
      expect(result.reachable).toBe(false);
      expect(result.totalWeight).toBe(20);
      expect(result.roundedTo).toBe(20);
      expect(result.perSide).toEqual({});
    });

    it('uses largest plates first (greedy)', () => {
      const result = calculatePlates(100, 20, DEFAULT_PLATES);
      
      expect(result.perSide).toEqual({ 25: 1, 15: 1 }); // 2×25 + 2×15 = 80
      expect(result.totalWeight).toBe(100);
    });

    it('handles 140kg (typical heavy squat)', () => {
      const result = calculatePlates(140, 20, DEFAULT_PLATES);
      
      expect(result.reachable).toBe(true);
      expect(result.totalWeight).toBe(140);
      expect(result.totalPerSide).toBe(60);
      expect(result.perSide).toEqual({ 25: 2, 10: 1 }); // 2×(2×25 + 10) = 120
    });

    it('uses custom bar weight', () => {
      const result = calculatePlates(60, 15, DEFAULT_PLATES); // Women's bar
      
      expect(result.reachable).toBe(true);
      expect(result.totalWeight).toBe(60);
      expect(result.totalPerSide).toBe(22.5);
      expect(result.perSide).toEqual({ 20: 1, 2.5: 1 });
    });
  });

  describe('formatPlateLoading', () => {
    it('formats a standard load', () => {
      const result = calculatePlates(60, 20, DEFAULT_PLATES);
      const formatted = formatPlateLoading(result, 20);
      
      expect(formatted).toBe('20 bar + 2×20');
    });

    it('formats empty bar', () => {
      const result = calculatePlates(20, 20, DEFAULT_PLATES);
      const formatted = formatPlateLoading(result, 20);
      
      expect(formatted).toBe('20 bar (empty)');
    });

    it('formats multiple plate sizes', () => {
      const result = calculatePlates(57.5, 20, DEFAULT_PLATES);
      const formatted = formatPlateLoading(result, 20);
      
      // Greedy uses 15 instead of 10+5
      expect(formatted).toBe('20 bar + 2×15 + 2×2.5 + 2×1.25');
    });
  });

  describe('findNearestAchievable', () => {
    it('returns exact weight when reachable', () => {
      const nearest = findNearestAchievable(60, 20, DEFAULT_PLATES);
      expect(nearest).toBe(60);
    });

    it('rounds down when unreachable', () => {
      const platesNoMicro = [25, 20, 15, 10, 5, 2.5];
      const nearest = findNearestAchievable(57.75, 20, platesNoMicro);
      // Without microplates, rounds down to 55 (20 + 2×17.5)
      expect(nearest).toBe(55);
    });
  });
});
