import { describe, it, expect } from 'vitest';
import { 
  createFuzzyEstimator,
  createSimpleFuzzyEstimator,
  SimpleModelConfigProvider,
  type FuzzyModelConfig,
  type ModelConfigProvider
} from '../index.js';

describe('Factory Functions', () => {
  const mockConfig: FuzzyModelConfig = {
    charsPerToken: 4,
    overhead: 10,
    cjkTokensPerChar: 1.2,
    mixedTextMultiplier: 1.05,
    numberTokensPerChar: 3.5,
    symbolTokensPerChar: 2.5,
    whitespaceHandling: 'compress'
  };

  describe('createFuzzyEstimator', () => {
    it('should create estimator with ModelConfigProvider', () => {
      const provider = new SimpleModelConfigProvider({
        'test-model': mockConfig
      });

      const estimator = createFuzzyEstimator(provider);
      
      expect(estimator).toBeDefined();
      expect(estimator.getSupportedModels()).toContain('test-model');
      expect(typeof estimator.estimate).toBe('function');
    });

    it('should create estimator with custom options', () => {
      const provider = new SimpleModelConfigProvider({
        'test-model': mockConfig
      });

      const customFallback: FuzzyModelConfig = {
        ...mockConfig,
        overhead: 20
      };

      const estimator = createFuzzyEstimator(provider, {
        fallbackConfig: customFallback,
        defaultModel: 'test-model'
      });

      expect(estimator).toBeDefined();
      
      // Test fallback by using unknown model
      const result = estimator.estimate('test', 'unknown-model');
      expect(result).toBeGreaterThan(20); // should use fallback overhead
    });

    it('should work with custom ModelConfigProvider', () => {
      class CustomProvider implements ModelConfigProvider {
        getConfig(modelName: string): FuzzyModelConfig | undefined {
          if (modelName === 'custom') {
            return mockConfig;
          }
          return undefined;
        }

        getSupportedModels(): string[] {
          return ['custom'];
        }

        getDefaultModel(): string | undefined {
          return 'custom';
        }
      }

      const estimator = createFuzzyEstimator(new CustomProvider());
      expect(estimator.getSupportedModels()).toContain('custom');
      
      const result = estimator.estimate('test', 'custom');
      expect(typeof result).toBe('number');
    });
  });

  describe('createSimpleFuzzyEstimator', () => {
    it('should create estimator with simple config object', () => {
      const estimator = createSimpleFuzzyEstimator({
        'model1': mockConfig,
        'model2': { ...mockConfig, overhead: 15 }
      });

      expect(estimator).toBeDefined();
      expect(estimator.getSupportedModels()).toContain('model1');
      expect(estimator.getSupportedModels()).toContain('model2');
    });

    it('should create estimator with default model', () => {
      const estimator = createSimpleFuzzyEstimator({
        'model1': mockConfig,
        'model2': { ...mockConfig, overhead: 15 }
      }, 'model1');

      expect(estimator).toBeDefined();
      
      // Test that default model is used when no model specified
      const result1 = estimator.estimate('test');
      const result2 = estimator.estimate('test', 'model1');
      expect(result1).toBe(result2);
    });

    it('should handle empty config object', () => {
      const estimator = createSimpleFuzzyEstimator({});
      
      expect(estimator).toBeDefined();
      expect(estimator.getSupportedModels()).toHaveLength(0);
      
      // Should use fallback config for unknown models
      const result = estimator.estimate('test', 'unknown');
      expect(typeof result).toBe('number');
    });

    it('should work with multiple models having different configs', () => {
      const estimator = createSimpleFuzzyEstimator({
        'fast': {
          charsPerToken: 6,
          overhead: 5,
          cjkTokensPerChar: 1.0,
          mixedTextMultiplier: 1.0
        },
        'accurate': {
          charsPerToken: 3,
          overhead: 15,
          cjkTokensPerChar: 1.5,
          mixedTextMultiplier: 1.1
        }
      });

      const fastResult = estimator.estimate('Hello World', 'fast');
      const accurateResult = estimator.estimate('Hello World', 'accurate');
      
      expect(typeof fastResult).toBe('number');
      expect(typeof accurateResult).toBe('number');
      expect(fastResult).not.toBe(accurateResult);
    });
  });

  describe('Integration Tests', () => {
    it('should produce consistent results between factory methods', () => {
      const config = {
        'test-model': mockConfig
      };

      // Create via direct provider
      const provider = new SimpleModelConfigProvider(config);
      const estimator1 = createFuzzyEstimator(provider);

      // Create via simple factory
      const estimator2 = createSimpleFuzzyEstimator(config);

      const text = 'Hello こんにちは World 世界';
      const result1 = estimator1.estimate(text, 'test-model');
      const result2 = estimator2.estimate(text, 'test-model');

      expect(result1).toBe(result2);
    });

    it('should handle realistic model configurations', () => {
      const estimator = createSimpleFuzzyEstimator({
        'gpt-3.5-turbo': {
          charsPerToken: 4,
          overhead: 10,
          cjkTokensPerChar: 1.2,
          mixedTextMultiplier: 1.05,
          numberTokensPerChar: 3.5,
          symbolTokensPerChar: 2.5,
          whitespaceHandling: 'compress'
        },
        'gpt-4': {
          charsPerToken: 3.5,
          overhead: 12,
          cjkTokensPerChar: 1.3,
          mixedTextMultiplier: 1.1,
          numberTokensPerChar: 3.0,
          symbolTokensPerChar: 2.8,
          whitespaceHandling: 'compress'
        }
      }, 'gpt-3.5-turbo');

      const testCases = [
        'Hello, world!',
        'こんにちは、世界！',
        'Hello world こんにちは 123 ★☆',
        '人工知能（AI）の発展により、自然言語処理技術が飛躍的に向上しています。'
      ];

      testCases.forEach(text => {
        const gpt35Result = estimator.estimate(text, 'gpt-3.5-turbo');
        const gpt4Result = estimator.estimate(text, 'gpt-4');
        
        expect(gpt35Result).toBeGreaterThan(0);
        expect(gpt4Result).toBeGreaterThan(0);
        expect(typeof gpt35Result).toBe('number');
        expect(typeof gpt4Result).toBe('number');
      });
    });
  });
});