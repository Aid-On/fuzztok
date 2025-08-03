/**
 * Fuzzy Token Estimator
 * 
 * 独自アルゴリズムによる高速・軽量なトークン推定ライブラリ
 * モデル設定は外部から注入する設計
 */

import { TextPayload, BaseTokenConfig } from './types/index.js';

/**
 * 文字種別の判定ユーティリティ
 */
export class CharacterClassifier {
  /**
   * CJK（中国語・日本語・韓国語）文字およびマルチバイト文字の判定
   */
  static isCJKCharacter(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      // CJK統合漢字拡張A-G、互換漢字など
      (code >= 0x2e80 && code <= 0x2eff) ||  // CJK部首補助
      (code >= 0x3000 && code <= 0x303f) ||  // CJK記号と句読点
      (code >= 0x3040 && code <= 0x309f) ||  // ひらがな
      (code >= 0x30a0 && code <= 0x30ff) ||  // カタカナ
      (code >= 0x3100 && code <= 0x312f) ||  // 注音符号
      (code >= 0x3130 && code <= 0x318f) ||  // ハングル互換字母
      (code >= 0x3190 && code <= 0x319f) ||  // 漢文用記号
      (code >= 0x31a0 && code <= 0x31bf) ||  // 注音字母拡張
      (code >= 0x31c0 && code <= 0x31ef) ||  // CJKストローク
      (code >= 0x31f0 && code <= 0x31ff) ||  // カタカナ拡張
      (code >= 0x3200 && code <= 0x32ff) ||  // 囲みCJK文字・月
      (code >= 0x3300 && code <= 0x33ff) ||  // CJK互換
      (code >= 0x3400 && code <= 0x4dbf) ||  // CJK統合漢字拡張A
      (code >= 0x4e00 && code <= 0x9fff) ||  // CJK統合漢字
      (code >= 0xa000 && code <= 0xa48f) ||  // イ文字
      (code >= 0xa490 && code <= 0xa4cf) ||  // イ文字部首
      (code >= 0xac00 && code <= 0xd7af) ||  // ハングル音節文字
      (code >= 0xf900 && code <= 0xfaff) ||  // CJK互換漢字
      (code >= 0xfe30 && code <= 0xfe4f) ||  // CJK互換形
      (code >= 0xff00 && code <= 0xffef) ||  // 半角・全角形
      (code >= 0x20000 && code <= 0x2a6df) || // CJK統合漢字拡張B
      (code >= 0x2a700 && code <= 0x2b73f) || // CJK統合漢字拡張C
      (code >= 0x2b740 && code <= 0x2b81f) || // CJK統合漢字拡張D
      (code >= 0x2b820 && code <= 0x2ceaf) || // CJK統合漢字拡張E
      (code >= 0x2ceb0 && code <= 0x2ebef) || // CJK統合漢字拡張F
      (code >= 0x30000 && code <= 0x3134f)    // CJK統合漢字拡張G
    );
  }

  /**
   * より詳細な文字種別の判定
   */
  static getCharacterType(char: string): 'cjk' | 'latin' | 'digit' | 'symbol' | 'whitespace' {
    if (this.isCJKCharacter(char)) return 'cjk';
    if (/[a-zA-Z\u00c0-\u024f\u1e00-\u1eff]/.test(char)) return 'latin'; // 拡張ラテン文字も含む
    if (/[0-9\u0660-\u0669\u06f0-\u06f9]/.test(char)) return 'digit'; // アラビア数字等も含む
    if (/\s/.test(char)) return 'whitespace';
    return 'symbol';
  }

  /**
   * テキスト全体の言語構成を分析
   */
  static analyzeTextComposition(text: string): {
    cjk: number;
    latin: number;
    digits: number;
    symbols: number;
    whitespace: number;
    total: number;
    cjkRatio: number;
  } {
    const composition = {
      cjk: 0,
      latin: 0,
      digits: 0,
      symbols: 0,
      whitespace: 0,
      total: text.length
    };

    for (const char of text) {
      const type = this.getCharacterType(char);
      if (type === 'digit') {
        composition.digits++;
      } else if (type === 'symbol') {
        composition.symbols++;
      } else {
        composition[type]++;
      }
    }

    return {
      ...composition,
      cjkRatio: composition.total > 0 ? composition.cjk / composition.total : 0
    };
  }
}

/**
 * ファジー推定用の拡張設定
 */
export interface FuzzyModelConfig extends BaseTokenConfig {
  cjkTokensPerChar: number;           // CJK文字1文字あたりのトークン数
  mixedTextMultiplier: number;        // 混在テキストの補正係数
  numberTokensPerChar?: number;       // 数字のトークン化率
  symbolTokensPerChar?: number;       // 記号のトークン化率
  whitespaceHandling?: 'ignore' | 'count' | 'compress';  // 空白文字の扱い
}

/**
 * モデル設定プロバイダーのインターフェース
 * 外部ライブラリがこのインターフェースを実装して設定を提供
 */
export interface ModelConfigProvider {
  /**
   * モデル名から設定を取得
   */
  getConfig(modelName: string): FuzzyModelConfig | undefined;
  
  /**
   * サポートされているモデル名の一覧を取得
   */
  getSupportedModels(): string[];
  
  /**
   * デフォルトのモデル名を取得（オプション）
   */
  getDefaultModel?(): string | undefined;
}

/**
 * シンプルなモデル設定プロバイダーの実装
 * ユーザーが設定を直接渡す場合に使用
 */
export class SimpleModelConfigProvider implements ModelConfigProvider {
  private configs: Map<string, FuzzyModelConfig>;
  private defaultModel?: string;

  constructor(configs: Record<string, FuzzyModelConfig>, defaultModel?: string) {
    this.configs = new Map(Object.entries(configs));
    this.defaultModel = defaultModel;
  }

  getConfig(modelName: string): FuzzyModelConfig | undefined {
    return this.configs.get(modelName);
  }

  getSupportedModels(): string[] {
    return Array.from(this.configs.keys());
  }

  getDefaultModel(): string | undefined {
    return this.defaultModel;
  }
}

/**
 * トークン推定結果の詳細情報
 */
export interface EstimationResult {
  tokens: number;
  breakdown: {
    cjk: number;
    latin: number;
    digits: number;
    symbols: number;
    overhead: number;
  };
  textAnalysis: {
    totalChars: number;
    cjkRatio: number;
    adjustmentFactor: number;
  };
  confidence: 'high' | 'medium' | 'low';
  modelUsed: string;
}

/**
 * デフォルトのフォールバック設定
 * モデル設定が見つからない場合に使用
 */
const DEFAULT_FALLBACK_CONFIG: FuzzyModelConfig = {
  charsPerToken: 4,
  overhead: 10,
  cjkTokensPerChar: 1.5,
  mixedTextMultiplier: 1.05,
  numberTokensPerChar: 3.5,
  symbolTokensPerChar: 2.5,
  whitespaceHandling: 'compress'
};

/**
 * メインのファジートークン推定器
 */
export class FuzzyTokenEstimator {
  private modelProvider: ModelConfigProvider;
  private fallbackConfig: FuzzyModelConfig;
  private defaultModel?: string;

  constructor(
    modelProvider: ModelConfigProvider,
    options?: {
      fallbackConfig?: FuzzyModelConfig;
      defaultModel?: string;
    }
  ) {
    this.modelProvider = modelProvider;
    this.fallbackConfig = options?.fallbackConfig || DEFAULT_FALLBACK_CONFIG;
    this.defaultModel = options?.defaultModel || modelProvider.getDefaultModel?.();
  }

  /**
   * 現在のモデルプロバイダーを取得
   */
  getModelProvider(): ModelConfigProvider {
    return this.modelProvider;
  }

  /**
   * モデルプロバイダーを変更
   */
  setModelProvider(provider: ModelConfigProvider): void {
    this.modelProvider = provider;
  }

  /**
   * 指定されたモデルの設定を取得（フォールバック付き）
   */
  private getModelConfig(modelName?: string): { config: FuzzyModelConfig; model: string } {
    const model = modelName || this.defaultModel || 'unknown';
    const config = this.modelProvider.getConfig(model) || this.fallbackConfig;
    return { config, model };
  }

  /**
   * 詳細な推定結果を返すメインメソッド
   */
  estimateDetailed(text: string, modelName?: string): EstimationResult {
    const { config, model } = this.getModelConfig(modelName);

    if (!text) {
      return {
        tokens: config.overhead,
        breakdown: {
          cjk: 0,
          latin: 0,
          digits: 0,
          symbols: 0,
          overhead: config.overhead
        },
        textAnalysis: {
          totalChars: 0,
          cjkRatio: 0,
          adjustmentFactor: 1
        },
        confidence: 'high',
        modelUsed: model
      };
    }

    // テキスト構成を分析
    const composition = CharacterClassifier.analyzeTextComposition(text);
    
    // 各文字種別ごとにトークンを計算
    const breakdown = {
      cjk: 0,
      latin: 0,
      digits: 0,
      symbols: 0,
      overhead: config.overhead
    };

    // 連続する同種文字をグループ化して計算
    let currentType: ReturnType<typeof CharacterClassifier.getCharacterType> | null = null;
    let currentGroup = '';

    const processGroup = (): void => {
      if (!currentGroup || !currentType) return;

      switch (currentType) {
        case 'cjk':
          breakdown.cjk += currentGroup.length * config.cjkTokensPerChar;
          break;
        case 'latin':
          breakdown.latin += Math.ceil(currentGroup.length / config.charsPerToken);
          break;
        case 'digit':
          breakdown.digits += Math.ceil(currentGroup.length / (config.numberTokensPerChar || 3.5));
          break;
        case 'symbol':
          breakdown.symbols += Math.ceil(currentGroup.length / (config.symbolTokensPerChar || 2.5));
          break;
        case 'whitespace':
          if (config.whitespaceHandling === 'count') {
            breakdown.symbols += currentGroup.length * 0.3;
          }
          break;
      }
      currentGroup = '';
    };

    // 文字をグループ化して処理
    for (const char of text) {
      const type = CharacterClassifier.getCharacterType(char);
      
      if (type !== currentType) {
        processGroup();
        currentType = type;
      }
      currentGroup += char;
    }
    processGroup();

    // 基本トークン数を計算
    let baseTokens = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    // 混在テキストの補正を適用
    baseTokens *= config.mixedTextMultiplier;

    // CJK文字の比率に基づく調整
    const adjustmentFactor = this.calculateAdjustmentFactor(composition.cjkRatio);
    const finalTokens = Math.ceil(baseTokens * adjustmentFactor);

    // 信頼度を計算
    const confidence = this.calculateConfidence(composition);

    return {
      tokens: finalTokens,
      breakdown,
      textAnalysis: {
        totalChars: text.length,
        cjkRatio: composition.cjkRatio,
        adjustmentFactor
      },
      confidence,
      modelUsed: model
    };
  }

  /**
   * シンプルなトークン数のみを返すメソッド
   */
  estimate(text: string, modelName?: string): number {
    return this.estimateDetailed(text, modelName).tokens;
  }

  /**
   * TextPayload形式での推定
   */
  estimatePayload(payload: TextPayload): number {
    const promptTokens = typeof payload.prompt === 'string' 
      ? this.estimate(payload.prompt, payload.model)
      : this.getModelConfig(payload.model).config.overhead;

    const maxTokens = payload.maxTokens && payload.maxTokens > 0 
      ? payload.maxTokens 
      : 500;

    // 安全マージン（10%）を追加
    return Math.ceil((promptTokens + maxTokens) * 1.1);
  }

  /**
   * 日本語比率に基づく調整係数を計算
   */
  private calculateAdjustmentFactor(japaneseRatio: number): number {
    if (japaneseRatio > 0.8) {
      return 0.6;
    } else if (japaneseRatio === 0) {
      return 1.0;
    } else if (japaneseRatio < 0.2) {
      return 0.7;
    } else {
      return 0.7 - ((japaneseRatio - 0.2) / 0.6) * 0.1;
    }
  }

  /**
   * 推定の信頼度を計算
   */
  private calculateConfidence(composition: ReturnType<typeof CharacterClassifier.analyzeTextComposition>): 'high' | 'medium' | 'low' {
    if (composition.total < 10) return 'low';
    if (composition.cjkRatio > 0.9 || composition.cjkRatio < 0.1) return 'high';
    if (composition.symbols / composition.total > 0.3) return 'low';
    return 'medium';
  }

  /**
   * バッチ推定
   */
  estimateBatch(texts: string[], modelName?: string): EstimationResult[] {
    return texts.map(text => this.estimateDetailed(text, modelName));
  }

  /**
   * ストリーミングテキストの推定
   */
  async *estimateStream(
    textStream: AsyncIterable<string>,
    modelName?: string
  ): AsyncGenerator<{ chunk: string; tokens: number; total: number }> {
    let total = 0;
    
    for await (const chunk of textStream) {
      const tokens = this.estimate(chunk, modelName);
      total += tokens;
      yield { chunk, tokens, total };
    }
  }

  /**
   * 利用可能なモデルの一覧を取得
   */
  getSupportedModels(): string[] {
    return this.modelProvider.getSupportedModels();
  }
}

/**
 * ファクトリー関数 - ModelConfigProviderを使用
 */
export function createFuzzyEstimator(
  modelProvider: ModelConfigProvider,
  options?: {
    fallbackConfig?: FuzzyModelConfig;
    defaultModel?: string;
  }
): FuzzyTokenEstimator {
  return new FuzzyTokenEstimator(modelProvider, options);
}

/**
 * 簡易ファクトリー関数 - 設定オブジェクトを直接渡す
 */
export function createSimpleFuzzyEstimator(
  modelConfigs: Record<string, FuzzyModelConfig>,
  defaultModel?: string
): FuzzyTokenEstimator {
  const provider = new SimpleModelConfigProvider(modelConfigs, defaultModel);
  return new FuzzyTokenEstimator(provider, { defaultModel });
}

/**
 * トークン数からコストを計算するユーティリティ
 * コスト情報も外部から注入可能
 */
export interface CostProvider {
  getCost(model: string): { input: number; output: number } | undefined;
}

export class TokenCostCalculator {
  constructor(private costProvider: CostProvider) {}

  calculate(model: string, inputTokens: number, outputTokens: number): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    formattedTotal: string;
    available: boolean;
  } {
    const pricing = this.costProvider.getCost(model);
    
    if (!pricing) {
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        formattedTotal: 'N/A',
        available: false
      };
    }
    
    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
      inputCost,
      outputCost,
      totalCost,
      formattedTotal: `$${totalCost.toFixed(4)}`,
      available: true
    };
  }
}

/**
 * デバッグ用のビジュアライザー
 */
export class TokenEstimationVisualizer {
  static visualize(text: string, result: EstimationResult): string {
    const bar = (value: number, max: number, width: number = 20): string => {
      const filled = Math.round((value / max) * width);
      return '█'.repeat(filled) + '░'.repeat(width - filled);
    };

    const maxTokens = Math.max(...Object.values(result.breakdown));
    
    return `
=== Token Estimation Visualization ===
Model: ${result.modelUsed}
Text: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"
Total Tokens: ${result.tokens}
Confidence: ${result.confidence}

Breakdown:
CJK       [${bar(result.breakdown.cjk, maxTokens)}] ${result.breakdown.cjk.toFixed(1)}
Latin     [${bar(result.breakdown.latin, maxTokens)}] ${result.breakdown.latin.toFixed(1)}
Digits    [${bar(result.breakdown.digits, maxTokens)}] ${result.breakdown.digits.toFixed(1)}
Symbols   [${bar(result.breakdown.symbols, maxTokens)}] ${result.breakdown.symbols.toFixed(1)}
Overhead  [${bar(result.breakdown.overhead, maxTokens)}] ${result.breakdown.overhead}

Text Analysis:
- Total Characters: ${result.textAnalysis.totalChars}
- CJK Ratio: ${(result.textAnalysis.cjkRatio * 100).toFixed(1)}%
- Adjustment Factor: ${result.textAnalysis.adjustmentFactor.toFixed(2)}
`;
  }
}
