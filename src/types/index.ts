/**
 * 基本型定義
 */

/**
 * テキスト推定用のペイロード
 */
export interface TextPayload {
  /** プロンプトテキスト */
  prompt: string | null;
  /** 使用するモデル名 */
  model?: string;
  /** 最大出力トークン数 */
  maxTokens?: number;
}

/**
 * 基本トークン設定
 */
export interface BaseTokenConfig {
  /** 1トークンあたりの文字数（平均） */
  charsPerToken: number;
  /** 固定オーバーヘッド（システムプロンプトなど） */
  overhead: number;
}
