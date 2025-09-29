/**
 * Unit Tests for Yield Calculator
 * Critical business logic testing for MeatMath Pro
 * Goal: Ensure accurate yield calculations for beef processing industry
 */

import { describe, it, expect } from 'vitest';

// Yield calculation functions
const calculateHangingWeight = (liveWeight: number, liveToHangingRatio: number): number => {
  return Number((liveWeight * liveToHangingRatio).toFixed(2));
};

const calculateRetailWeight = (hangingWeight: number, hangingToRetailRatio: number): number => {
  return Number((hangingWeight * hangingToRetailRatio).toFixed(2));
};

const calculateYieldPercentage = (finalWeight: number, initialWeight: number): number => {
  return Number(((finalWeight / initialWeight) * 100).toFixed(2));
};

const calculateProcessingCost = (hangingWeight: number, costPerPound: number): number => {
  return Number((hangingWeight * costPerPound).toFixed(2));
};

describe('Yield Calculator - Core Business Logic', () => {
  describe('Live to Hanging Weight Calculations', () => {
    it('should calculate correct hanging weight for standard beef cattle (62.5% ratio)', () => {
      const liveWeight = 1200;
      const standardBeefRatio = 0.625;
      const result = calculateHangingWeight(liveWeight, standardBeefRatio);
      
      expect(result).toBe(750); // 1200 * 0.625 = 750
    });

    it('should handle decimal live weights correctly', () => {
      const liveWeight = 1235.75;
      const ratio = 0.625;
      const result = calculateHangingWeight(liveWeight, ratio);
      
      expect(result).toBe(772.34); // 1235.75 * 0.625 = 772.34375 rounded to 772.34
    });

    it('should handle edge case of zero live weight', () => {
      const liveWeight = 0;
      const ratio = 0.625;
      const result = calculateHangingWeight(liveWeight, ratio);
      
      expect(result).toBe(0);
    });

    it('should handle very large live weights', () => {
      const liveWeight = 2500;
      const ratio = 0.625;
      const result = calculateHangingWeight(liveWeight, ratio);
      
      expect(result).toBe(1562.5);
    });
  });

  describe('Hanging to Retail Weight Calculations', () => {
    it('should calculate correct retail weight for standard beef (74.2% ratio)', () => {
      const hangingWeight = 750;
      const standardRetailRatio = 0.742;
      const result = calculateRetailWeight(hangingWeight, standardRetailRatio);
      
      expect(result).toBe(556.5); // 750 * 0.742 = 556.5
    });

    it('should handle pork retail calculations (71.8% ratio)', () => {
      const hangingWeight = 180; // typical pork hanging weight
      const porkRetailRatio = 0.718;
      const result = calculateRetailWeight(hangingWeight, porkRetailRatio);
      
      expect(result).toBe(129.24); // 180 * 0.718 = 129.24
    });

    it('should handle lamb retail calculations (69.4% ratio)', () => {
      const hangingWeight = 40; // typical lamb hanging weight
      const lambRetailRatio = 0.694;
      const result = calculateRetailWeight(hangingWeight, lambRetailRatio);
      
      expect(result).toBe(27.76); // 40 * 0.694 = 27.76
    });
  });

  describe('Full Yield Chain Calculations', () => {
    it('should calculate complete beef processing chain correctly', () => {
      const liveWeight = 1200;
      const liveToHangingRatio = 0.625; // 62.5%
      const hangingToRetailRatio = 0.742; // 74.2%
      
      const hangingWeight = calculateHangingWeight(liveWeight, liveToHangingRatio);
      const retailWeight = calculateRetailWeight(hangingWeight, hangingToRetailRatio);
      const totalYield = calculateYieldPercentage(retailWeight, liveWeight);
      
      expect(hangingWeight).toBe(750);
      expect(retailWeight).toBe(556.5);
      expect(totalYield).toBe(46.38); // 556.5 / 1200 * 100 = 46.375 rounded to 46.38
    });

    it('should match industry standard yields for different species', () => {
      // Industry standard test cases
      const testCases = [
        {
          species: 'beef',
          liveWeight: 1200,
          liveToHangingRatio: 0.625,
          hangingToRetailRatio: 0.742,
          expectedHanging: 750,
          expectedRetail: 556.5
        },
        {
          species: 'pork',
          liveWeight: 250,
          liveToHangingRatio: 0.720,
          hangingToRetailRatio: 0.718,
          expectedHanging: 180,
          expectedRetail: 129.24
        },
        {
          species: 'lamb',
          liveWeight: 70,
          liveToHangingRatio: 0.580,
          hangingToRetailRatio: 0.694,
          expectedHanging: 40.6,
          expectedRetail: 28.18
        }
      ];

      testCases.forEach(testCase => {
        const hangingWeight = calculateHangingWeight(testCase.liveWeight, testCase.liveToHangingRatio);
        const retailWeight = calculateRetailWeight(hangingWeight, testCase.hangingToRetailRatio);
        
        expect(hangingWeight).toBe(testCase.expectedHanging);
        expect(retailWeight).toBe(testCase.expectedRetail);
      });
    });
  });

  describe('Processing Cost Calculations', () => {
    it('should calculate processing costs correctly', () => {
      const hangingWeight = 750;
      const costPerPound = 0.85;
      const result = calculateProcessingCost(hangingWeight, costPerPound);
      
      expect(result).toBe(637.5); // 750 * 0.85 = 637.5
    });

    it('should handle fractional costs correctly', () => {
      const hangingWeight = 456.25;
      const costPerPound = 1.23;
      const result = calculateProcessingCost(hangingWeight, costPerPound);
      
      expect(result).toBe(561.19); // 456.25 * 1.23 = 561.1875 rounded to 561.19
    });
  });

  describe('Yield Percentage Calculations', () => {
    it('should calculate yield percentages correctly', () => {
      const finalWeight = 556.5;
      const initialWeight = 1200;
      const result = calculateYieldPercentage(finalWeight, initialWeight);
      
      expect(result).toBe(46.38);
    });

    it('should handle 100% yield correctly', () => {
      const finalWeight = 100;
      const initialWeight = 100;
      const result = calculateYieldPercentage(finalWeight, initialWeight);
      
      expect(result).toBe(100);
    });

    it('should handle zero yield correctly', () => {
      const finalWeight = 0;
      const initialWeight = 100;
      const result = calculateYieldPercentage(finalWeight, initialWeight);
      
      expect(result).toBe(0);
    });
  });

  describe('Input Validation', () => {
    it('should handle invalid inputs gracefully', () => {
      // Test negative weights
      expect(() => calculateHangingWeight(-100, 0.625)).not.toThrow();
      expect(calculateHangingWeight(-100, 0.625)).toBe(-62.5);
      
      // Test negative ratios
      expect(() => calculateHangingWeight(100, -0.5)).not.toThrow();
      expect(calculateHangingWeight(100, -0.5)).toBe(-50);
    });

    it('should handle extreme ratios', () => {
      // Test ratio > 1 (should be prevented in UI but handled in calculations)
      const result = calculateHangingWeight(1000, 1.5);
      expect(result).toBe(1500);
      
      // Test very small ratios
      const smallRatio = calculateHangingWeight(1000, 0.001);
      expect(smallRatio).toBe(1);
    });

    it('should maintain precision with repeated calculations', () => {
      let weight = 1000;
      const ratio = 0.625;
      
      // Apply ratio multiple times
      for (let i = 0; i < 5; i++) {
        weight = calculateHangingWeight(weight, ratio);
      }
      
      // Should maintain reasonable precision
      expect(weight).toBeCloseTo(95.37, 2); // 1000 * (0.625^5) ≈ 95.37
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate beef cattle yield ratios are within industry standards', () => {
      const industryMinHanging = 0.55; // 55% minimum
      const industryMaxHanging = 0.70; // 70% maximum
      const industryMinRetail = 0.65;  // 65% of hanging weight minimum
      const industryMaxRetail = 0.80;  // 80% of hanging weight maximum
      
      const testRatios = [
        { hanging: 0.625, retail: 0.742, valid: true },  // Standard beef
        { hanging: 0.45, retail: 0.742, valid: false },  // Too low hanging
        { hanging: 0.75, retail: 0.742, valid: false },  // Too high hanging
        { hanging: 0.625, retail: 0.50, valid: false },  // Too low retail
        { hanging: 0.625, retail: 0.85, valid: false },  // Too high retail
      ];
      
      testRatios.forEach(test => {
        const hangingValid = test.hanging >= industryMinHanging && test.hanging <= industryMaxHanging;
        const retailValid = test.retail >= industryMinRetail && test.retail <= industryMaxRetail;
        const overallValid = hangingValid && retailValid;
        
        expect(overallValid).toBe(test.valid);
      });
    });

    it('should ensure calculations are financially accurate for invoicing', () => {
      // Test case: Customer brings 1200lb steer, expects accurate weights for billing
      const liveWeight = 1200;
      const liveToHangingRatio = 0.625;
      const hangingToRetailRatio = 0.742;
      const processingCost = 0.85;
      
      const hangingWeight = calculateHangingWeight(liveWeight, liveToHangingRatio);
      const retailWeight = calculateRetailWeight(hangingWeight, hangingToRetailRatio);
      const totalCost = calculateProcessingCost(hangingWeight, processingCost);
      
      // Verify all calculations for customer invoice
      expect(hangingWeight).toBe(750);     // Customer pays processing on this weight
      expect(retailWeight).toBe(556.5);    // Customer receives this much meat
      expect(totalCost).toBe(637.5);       // Customer's total processing bill
      
      // Verify yield percentage for customer transparency
      const yieldPercentage = calculateYieldPercentage(retailWeight, liveWeight);
      expect(yieldPercentage).toBe(46.38); // Customer gets 46.38% of live weight as retail cuts
    });
  });
});

// Export functions for use in other modules
export {
  calculateHangingWeight,
  calculateRetailWeight,
  calculateYieldPercentage,
  calculateProcessingCost
};