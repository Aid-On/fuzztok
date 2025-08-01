import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FuzzyTokenEstimator, 
  SimpleModelConfigProvider,
  type FuzzyModelConfig 
} from '../index.js';

describe('FuzzyTokenEstimator', () => {
  let estimator: FuzzyTokenEstimator;
  let mockConfig: FuzzyModelConfig;

  beforeEach(() => {
    mockConfig = {
      charsPerToken: 4,
      overhead: 10,
      cjkTokensPerChar: 1.2,
      mixedTextMultiplier: 1.05,
      numberTokensPerChar: 3.5,
      symbolTokensPerChar: 2.5,
      whitespaceHandling: 'compress'
    };

    const provider = new SimpleModelConfigProvider({
      'test-model': mockConfig
    }, 'test-model');

    estimator = new FuzzyTokenEstimator(provider);
  });

  describe('estimate', () => {
    it('should estimate English text correctly', () => {
      const result = estimator.estimate('Hello World');
      expect(result).toBeGreaterThan(10); // overhead + some tokens
      expect(typeof result).toBe('number');
    });

    it('should estimate Japanese text correctly', () => {
      const result = estimator.estimate('こんにちは');
      expect(result).toBeGreaterThan(10); // overhead + CJK tokens
      expect(typeof result).toBe('number');
    });

    it('should handle empty text', () => {
      const result = estimator.estimate('');
      expect(result).toBe(mockConfig.overhead);
    });

    it('should handle mixed text', () => {
      const result = estimator.estimate('Hello こんにちは 123');
      expect(result).toBeGreaterThan(mockConfig.overhead);
      expect(typeof result).toBe('number');
    });

    it('should use different models when specified', () => {
      const provider = new SimpleModelConfigProvider({
        'model1': { ...mockConfig, overhead: 5 },
        'model2': { ...mockConfig, overhead: 15 }
      });
      const est = new FuzzyTokenEstimator(provider);

      const result1 = est.estimate('test', 'model1');
      const result2 = est.estimate('test', 'model2');
      
      expect(result2).toBeGreaterThan(result1);
    });
  });

  describe('estimateDetailed', () => {
    it('should provide detailed breakdown for English text', () => {
      const result = estimator.estimateDetailed('Hello World!');
      
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('textAnalysis');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('modelUsed');

      expect(result.breakdown.latin).toBeGreaterThan(0);
      expect(result.breakdown.cjk).toBe(0);
      expect(result.breakdown.overhead).toBe(mockConfig.overhead);
      expect(result.textAnalysis.cjkRatio).toBe(0);
      expect(result.confidence).toMatch(/^(high|medium|low)$/);
    });

    it('should provide detailed breakdown for Japanese text', () => {
      const result = estimator.estimateDetailed('こんにちは世界');
      
      expect(result.breakdown.cjk).toBeGreaterThan(0);
      expect(result.breakdown.latin).toBe(0);
      expect(result.textAnalysis.cjkRatio).toBe(1);
    });

    it('should provide detailed breakdown for mixed text', () => {
      const result = estimator.estimateDetailed('Hello こんにちは 123 ★');
      
      expect(result.breakdown.cjk).toBeGreaterThan(0);
      expect(result.breakdown.latin).toBeGreaterThan(0);
      expect(result.breakdown.digits).toBeGreaterThan(0);
      expect(result.breakdown.symbols).toBeGreaterThan(0);
      expect(result.textAnalysis.cjkRatio).toBeGreaterThan(0);
      expect(result.textAnalysis.cjkRatio).toBeLessThan(1);
    });

    it('should return consistent confidence levels', () => {
      const shortText = estimator.estimateDetailed('Hi');
      const longEnglish = estimator.estimateDetailed('The quick brown fox jumps over the lazy dog.');
      const longJapanese = estimator.estimateDetailed('これは日本語のテストメッセージです。');
      
      expect(shortText.confidence).toBe('low'); // short text
      expect(longEnglish.confidence).toBe('high'); // pure English
      expect(longJapanese.confidence).toBe('high'); // pure CJK
    });
  });

  describe('estimatePayload', () => {
    it('should estimate from TextPayload with string prompt', () => {
      const payload = {
        prompt: 'Hello World',
        model: 'test-model',
        maxTokens: 100
      };

      const result = estimator.estimatePayload(payload);
      expect(result).toBeGreaterThan(100); // should include safety margin
    });

    it('should handle null prompt', () => {
      const payload = {
        prompt: null,
        model: 'test-model',
        maxTokens: 100
      };

      const result = estimator.estimatePayload(payload);
      expect(result).toBeGreaterThan(100);
    });

    it('should use default maxTokens when not provided', () => {
      const payload = {
        prompt: 'Hello World',
        model: 'test-model'
      };

      const result = estimator.estimatePayload(payload);
      expect(result).toBeGreaterThan(500); // should include default maxTokens
    });
  });

  describe('estimateBatch', () => {
    it('should estimate multiple texts', () => {
      const texts = ['Hello', 'こんにちは', 'Mixed text こんにちは'];
      const results = estimator.estimateBatch(texts);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('tokens');
        expect(result).toHaveProperty('breakdown');
        expect(result).toHaveProperty('textAnalysis');
      });
    });

    it('should handle empty batch', () => {
      const results = estimator.estimateBatch([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('getSupportedModels', () => {
    it('should return supported models from provider', () => {
      const models = estimator.getSupportedModels();
      expect(models).toContain('test-model');
      expect(Array.isArray(models)).toBe(true);
    });
  });

  describe('setModelProvider', () => {
    it('should allow changing model provider', () => {
      const newProvider = new SimpleModelConfigProvider({
        'new-model': { ...mockConfig, overhead: 20 }
      });

      estimator.setModelProvider(newProvider);
      const models = estimator.getSupportedModels();
      expect(models).toContain('new-model');
    });
  });

  describe('edge cases', () => {
    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      const result = estimator.estimate(longText);
      expect(result).toBeGreaterThan(1000);
    });

    it('should handle text with only whitespace', () => {
      const result = estimator.estimateDetailed('   \t\n  ');
      expect(result.breakdown.symbols).toBeGreaterThanOrEqual(0); // whitespace is handled as symbols in cost
      expect(result.textAnalysis.totalChars).toBeGreaterThan(0);
    });

    it('should handle text with only symbols', () => {
      const result = estimator.estimateDetailed('!@#$%^&*()');
      expect(result.breakdown.symbols).toBeGreaterThan(0);
      expect(result.breakdown.latin).toBe(0);
      expect(result.breakdown.cjk).toBe(0);
    });

    it('should handle unknown model gracefully', () => {
      const result = estimator.estimate('test', 'unknown-model');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });
});