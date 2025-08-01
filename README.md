# @aid-on/fuzztok

Fast and lightweight fuzzy token estimation library with CJK support

[日本語版 README](./README.ja.md)

## Features

- **🚀 High Performance**: Optimized for speed and low memory usage
- **🌏 CJK Support**: Advanced support for Chinese, Japanese, and Korean text
- **🔧 Flexible Architecture**: Dependency injection pattern for model configurations
- **📊 Detailed Analysis**: Character type breakdown and composition analysis
- **⚡ Batch Processing**: Support for batch estimation and streaming text
- **💰 Cost Calculation**: Built-in token-to-cost conversion utilities
- **🐛 Debug Tools**: Visualization tools for estimation breakdown

## Installation

```bash
npm install @aid-on/fuzztok
```

## Quick Start

```javascript
import { createSimpleFuzzyEstimator } from '@aid-on/fuzztok';

// Configure models
const modelConfigs = {
  'gpt-3.5-turbo': {
    charsPerToken: 4,
    overhead: 10,
    cjkTokensPerChar: 1.2,
    mixedTextMultiplier: 1.05,
    numberTokensPerChar: 3.5,
    symbolTokensPerChar: 2.5,
    whitespaceHandling: 'compress'
  }
};

// Create estimator
const estimator = createSimpleFuzzyEstimator(modelConfigs, 'gpt-3.5-turbo');

// Simple estimation
const tokens = estimator.estimate('Hello, world! こんにちは！');
console.log(\`Estimated tokens: \${tokens}\`);

// Detailed estimation
const detailed = estimator.estimateDetailed('Hello, world! こんにちは！');
console.log(detailed);
```

## API Reference

### Core Classes

#### `FuzzyTokenEstimator`

Main estimation engine with dependency injection for model configurations.

```typescript
constructor(
  modelProvider: ModelConfigProvider,
  options?: {
    fallbackConfig?: FuzzyModelConfig;
    defaultModel?: string;
  }
)
```

**Methods:**
- `estimate(text: string, modelName?: string): number` - Simple token count
- `estimateDetailed(text: string, modelName?: string): EstimationResult` - Detailed analysis
- `estimatePayload(payload: TextPayload): number` - Estimate from text payload
- `estimateBatch(texts: string[], modelName?: string): EstimationResult[]` - Batch processing

#### `CharacterClassifier`

Utility for character type detection and text analysis.

```typescript
// Static methods
CharacterClassifier.isCJKCharacter(char: string): boolean
CharacterClassifier.getCharacterType(char: string): CharacterType
CharacterClassifier.analyzeTextComposition(text: string): TextComposition
```

### Configuration

#### `FuzzyModelConfig`

```typescript
interface FuzzyModelConfig extends BaseTokenConfig {
  cjkTokensPerChar: number;           // CJK characters per token
  mixedTextMultiplier: number;        // Mixed text adjustment factor
  numberTokensPerChar?: number;       // Number tokenization rate
  symbolTokensPerChar?: number;       // Symbol tokenization rate
  whitespaceHandling?: 'ignore' | 'count' | 'compress';
}
```

### Factory Functions

```typescript
// Using ModelConfigProvider
createFuzzyEstimator(
  modelProvider: ModelConfigProvider,
  options?: ConfigOptions
): FuzzyTokenEstimator

// Using simple config object
createSimpleFuzzyEstimator(
  modelConfigs: Record<string, FuzzyModelConfig>,
  defaultModel?: string
): FuzzyTokenEstimator
```

## Advanced Usage

### Custom Model Provider

```javascript
import { FuzzyTokenEstimator } from '@aid-on/fuzztok';

class CustomModelProvider {
  getConfig(modelName) {
    // Fetch from database, API, etc.
    return {
      charsPerToken: 4,
      overhead: 10,
      cjkTokensPerChar: 1.2,
      mixedTextMultiplier: 1.05
    };
  }
  
  getSupportedModels() {
    return ['custom-model-1', 'custom-model-2'];
  }
}

const estimator = new FuzzyTokenEstimator(new CustomModelProvider());
```

### Cost Calculation

```javascript
import { TokenCostCalculator } from '@aid-on/fuzztok';

class MyCostProvider {
  getCost(model) {
    return { input: 0.0015, output: 0.002 }; // per 1K tokens
  }
}

const calculator = new TokenCostCalculator(new MyCostProvider());
const cost = calculator.calculate('gpt-3.5-turbo', 1000, 500);
console.log(cost.formattedTotal); // "$2.25"
```

### Streaming Support

```javascript
async function* textStream() {
  yield "Hello ";
  yield "world ";
  yield "こんにちは！";
}

for await (const result of estimator.estimateStream(textStream())) {
  console.log(\`Chunk: \${result.chunk}, Tokens: \${result.tokens}, Total: \${result.total}\`);
}
```

## CJK Support

This library provides comprehensive support for CJK text:

- **Chinese**: Simplified and Traditional Chinese characters
- **Japanese**: Hiragana, Katakana, and Kanji
- **Korean**: Hangul syllables and compatibility characters
- **Extended Unicode**: CJK Extension A-G, compatibility forms, and more

## License

MIT

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/Aid-On/fuzztok).
