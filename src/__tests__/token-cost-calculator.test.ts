import { describe, it, expect } from 'vitest';
import { TokenCostCalculator, type CostProvider } from '../index.js';

describe('TokenCostCalculator', () => {
  describe('with valid cost provider', () => {
    class MockCostProvider implements CostProvider {
      getCost(model: string): { input: number; output: number } | undefined {
        const costs: Record<string, { input: number; output: number }> = {
          'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
          'gpt-4': { input: 0.03, output: 0.06 },
          'cheap-model': { input: 0.001, output: 0.001 }
        };
        return costs[model];
      }
    }

    let calculator: TokenCostCalculator;

    beforeEach(() => {
      calculator = new TokenCostCalculator(new MockCostProvider());
    });

    it('should calculate costs correctly for gpt-3.5-turbo', () => {
      const result = calculator.calculate('gpt-3.5-turbo', 1000, 500);
      
      expect(result.available).toBe(true);
      expect(result.inputCost).toBe(0.0015); // (1000/1000) * 0.0015
      expect(result.outputCost).toBe(0.001);  // (500/1000) * 0.002
      expect(result.totalCost).toBe(0.0025);
      expect(result.formattedTotal).toBe('$0.0025');
    });

    it('should calculate costs correctly for gpt-4', () => {
      const result = calculator.calculate('gpt-4', 2000, 1000);
      
      expect(result.available).toBe(true);
      expect(result.inputCost).toBe(0.06);   // (2000/1000) * 0.03
      expect(result.outputCost).toBe(0.06);  // (1000/1000) * 0.06
      expect(result.totalCost).toBe(0.12);
      expect(result.formattedTotal).toBe('$0.1200');
    });

    it('should handle fractional token counts', () => {
      const result = calculator.calculate('cheap-model', 250, 750);
      
      expect(result.available).toBe(true);
      expect(result.inputCost).toBe(0.00025);  // (250/1000) * 0.001
      expect(result.outputCost).toBe(0.00075); // (750/1000) * 0.001
      expect(result.totalCost).toBe(0.001);
      expect(result.formattedTotal).toBe('$0.0010');
    });

    it('should handle zero tokens', () => {
      const result = calculator.calculate('gpt-3.5-turbo', 0, 0);
      
      expect(result.available).toBe(true);
      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.formattedTotal).toBe('$0.0000');
    });

    it('should handle large token counts', () => {
      const result = calculator.calculate('gpt-3.5-turbo', 100000, 50000);
      
      expect(result.available).toBe(true);
      expect(result.inputCost).toBe(0.15);  // (100000/1000) * 0.0015
      expect(result.outputCost).toBe(0.1);  // (50000/1000) * 0.002
      expect(result.totalCost).toBe(0.25);
      expect(result.formattedTotal).toBe('$0.2500');
    });
  });

  describe('with unavailable model', () => {
    class LimitedCostProvider implements CostProvider {
      getCost(model: string): { input: number; output: number } | undefined {
        if (model === 'available-model') {
          return { input: 0.001, output: 0.002 };
        }
        return undefined;
      }
    }

    it('should return unavailable result for unknown model', () => {
      const calculator = new TokenCostCalculator(new LimitedCostProvider());
      const result = calculator.calculate('unknown-model', 1000, 500);
      
      expect(result.available).toBe(false);
      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.formattedTotal).toBe('N/A');
    });

    it('should work correctly for available model', () => {
      const calculator = new TokenCostCalculator(new LimitedCostProvider());
      const result = calculator.calculate('available-model', 1000, 500);
      
      expect(result.available).toBe(true);
      expect(result.totalCost).toBe(0.002); // (1000/1000)*0.001 + (500/1000)*0.002
    });
  });

  describe('edge cases', () => {
    class EdgeCaseCostProvider implements CostProvider {
      getCost(_model: string): { input: number; output: number } | undefined {
        return { input: 0, output: 0 };
      }
    }

    it('should handle zero costs', () => {
      const calculator = new TokenCostCalculator(new EdgeCaseCostProvider());
      const result = calculator.calculate('free-model', 1000, 500);
      
      expect(result.available).toBe(true);
      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.formattedTotal).toBe('$0.0000');
    });

    it('should handle very small costs', () => {
      class SmallCostProvider implements CostProvider {
        getCost(): { input: number; output: number } {
          return { input: 0.000001, output: 0.000001 };
        }
      }

      const calculator = new TokenCostCalculator(new SmallCostProvider());
      const result = calculator.calculate('micro-model', 1000, 1000);
      
      expect(result.available).toBe(true);
      expect(result.totalCost).toBe(0.000002);
      expect(result.formattedTotal).toBe('$0.0000');
    });

    it('should handle very large costs', () => {
      class ExpensiveCostProvider implements CostProvider {
        getCost(): { input: number; output: number } {
          return { input: 1.0, output: 2.0 };
        }
      }

      const calculator = new TokenCostCalculator(new ExpensiveCostProvider());
      const result = calculator.calculate('expensive-model', 1000, 1000);
      
      expect(result.available).toBe(true);
      expect(result.totalCost).toBe(3.0);
      expect(result.formattedTotal).toBe('$3.0000');
    });
  });

  describe('realistic scenarios', () => {
    class RealisticCostProvider implements CostProvider {
      getCost(model: string): { input: number; output: number } | undefined {
        const costs: Record<string, { input: number; output: number }> = {
          'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
          'gpt-4': { input: 0.03, output: 0.06 },
          'gpt-4-turbo': { input: 0.01, output: 0.03 },
          'claude-3-sonnet': { input: 0.003, output: 0.015 }
        };
        return costs[model];
      }
    }

    it('should calculate realistic chat conversation costs', () => {
      const calculator = new TokenCostCalculator(new RealisticCostProvider());
      
      // Typical chat: 500 input tokens, 200 output tokens
      const gpt35Result = calculator.calculate('gpt-3.5-turbo', 500, 200);
      const gpt4Result = calculator.calculate('gpt-4', 500, 200);
      
      expect(gpt35Result.totalCost).toBe(0.00115); // 0.00075 + 0.0004
      expect(gpt4Result.totalCost).toBe(0.027);   // 0.015 + 0.012
      expect(gpt4Result.totalCost).toBeGreaterThan(gpt35Result.totalCost);
    });

    it('should calculate realistic long document costs', () => {
      const calculator = new TokenCostCalculator(new RealisticCostProvider());
      
      // Long document: 8000 input tokens, 2000 output tokens
      const claudeResult = calculator.calculate('claude-3-sonnet', 8000, 2000);
      const gpt4TurboResult = calculator.calculate('gpt-4-turbo', 8000, 2000);
      
      expect(claudeResult.totalCost).toBe(0.054);    // 0.024 + 0.03
      expect(gpt4TurboResult.totalCost).toBe(0.14);  // 0.08 + 0.06
    });
  });
});