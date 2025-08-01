# @aid-on/fuzztok

高速・軽量なファジートークン推定ライブラリ（CJK文字対応）

[English README](./README.md)

## 特徴

- **🚀 高速性能**: 速度とメモリ使用量を最適化
- **🌏 CJK対応**: 中国語、日本語、韓国語テキストの高度なサポート
- **🔧 柔軟なアーキテクチャ**: モデル設定の依存性注入パターン
- **📊 詳細分析**: 文字種別の内訳と構成分析
- **⚡ バッチ処理**: バッチ推定とストリーミングテキストのサポート
- **💰 コスト計算**: 組み込みトークン-コスト変換ユーティリティ
- **🐛 デバッグツール**: 推定内訳の可視化ツール

## インストール

```bash
npm install @aid-on/fuzztok
```

## クイックスタート

```javascript
import { createSimpleFuzzyEstimator } from '@aid-on/fuzztok';

// モデル設定
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

// 推定器を作成
const estimator = createSimpleFuzzyEstimator(modelConfigs, 'gpt-3.5-turbo');

// シンプルな推定
const tokens = estimator.estimate('Hello, world! こんにちは！');
console.log(\`推定トークン数: \${tokens}\`);

// 詳細な推定
const detailed = estimator.estimateDetailed('Hello, world! こんにちは！');
console.log(detailed);
```

## API リファレンス

### コアクラス

#### `FuzzyTokenEstimator`

モデル設定の依存性注入を持つメイン推定エンジン。

```typescript
constructor(
  modelProvider: ModelConfigProvider,
  options?: {
    fallbackConfig?: FuzzyModelConfig;
    defaultModel?: string;
  }
)
```

**メソッド:**
- `estimate(text: string, modelName?: string): number` - シンプルなトークン数
- `estimateDetailed(text: string, modelName?: string): EstimationResult` - 詳細分析
- `estimatePayload(payload: TextPayload): number` - テキストペイロードからの推定
- `estimateBatch(texts: string[], modelName?: string): EstimationResult[]` - バッチ処理

#### `CharacterClassifier`

文字種別検出とテキスト分析のユーティリティ。

```typescript
// 静的メソッド
CharacterClassifier.isCJKCharacter(char: string): boolean
CharacterClassifier.getCharacterType(char: string): CharacterType
CharacterClassifier.analyzeTextComposition(text: string): TextComposition
```

### 設定

#### `FuzzyModelConfig`

```typescript
interface FuzzyModelConfig extends BaseTokenConfig {
  cjkTokensPerChar: number;           // CJK文字1文字あたりのトークン数
  mixedTextMultiplier: number;        // 混在テキストの調整係数
  numberTokensPerChar?: number;       // 数字のトークン化率
  symbolTokensPerChar?: number;       // 記号のトークン化率
  whitespaceHandling?: 'ignore' | 'count' | 'compress'; // 空白文字の扱い
}
```

### ファクトリー関数

```typescript
// ModelConfigProviderを使用
createFuzzyEstimator(
  modelProvider: ModelConfigProvider,
  options?: ConfigOptions
): FuzzyTokenEstimator

// シンプルな設定オブジェクトを使用  
createSimpleFuzzyEstimator(
  modelConfigs: Record<string, FuzzyModelConfig>,
  defaultModel?: string
): FuzzyTokenEstimator
```

## 高度な使い方

### カスタムモデルプロバイダー

```javascript
import { FuzzyTokenEstimator } from '@aid-on/fuzztok';

class CustomModelProvider {
  getConfig(modelName) {
    // データベース、APIなどから取得
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

### コスト計算

```javascript
import { TokenCostCalculator } from '@aid-on/fuzztok';

class MyCostProvider {
  getCost(model) {
    return { input: 0.0015, output: 0.002 }; // 1Kトークンあたり
  }
}

const calculator = new TokenCostCalculator(new MyCostProvider());
const cost = calculator.calculate('gpt-3.5-turbo', 1000, 500);
console.log(cost.formattedTotal); // "$2.25"
```

### ストリーミングサポート

```javascript
async function* textStream() {
  yield "Hello ";
  yield "world ";
  yield "こんにちは！";
}

for await (const result of estimator.estimateStream(textStream())) {
  console.log(\`チャンク: \${result.chunk}, トークン: \${result.tokens}, 合計: \${result.total}\`);
}
```

## CJK対応

このライブラリはCJKテキストの包括的なサポートを提供します：

- **中国語**: 簡体字・繁体字
- **日本語**: ひらがな、カタカナ、漢字
- **韓国語**: ハングル音節文字と互換文字
- **拡張Unicode**: CJK拡張A-G、互換形など

## ライセンス

MIT

## 貢献

イシューやプルリクエストを[GitHub](https://github.com/aid-on-libs/fuzztok)でお待ちしています。