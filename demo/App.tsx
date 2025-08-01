import React, { useState, useEffect } from 'react'
import { createSimpleFuzzyEstimator, type ModelConfigs } from '../src'
import './App.css'

const modelConfigs: ModelConfigs = {
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
    charsPerToken: 4,
    overhead: 12,
    cjkTokensPerChar: 1.3,
    mixedTextMultiplier: 1.08,
    numberTokensPerChar: 3.2,
    symbolTokensPerChar: 2.3,
    whitespaceHandling: 'compress'
  },
  'claude-3-haiku': {
    charsPerToken: 3.8,
    overhead: 8,
    cjkTokensPerChar: 1.1,
    mixedTextMultiplier: 1.03,
    numberTokensPerChar: 3.8,
    symbolTokensPerChar: 2.8,
    whitespaceHandling: 'compress'
  },
  'claude-3-sonnet': {
    charsPerToken: 3.9,
    overhead: 9,
    cjkTokensPerChar: 1.15,
    mixedTextMultiplier: 1.04,
    numberTokensPerChar: 3.6,
    symbolTokensPerChar: 2.6,
    whitespaceHandling: 'compress'
  }
}

export default function App() {
  const [text, setText] = useState('Hello, world! こんにちは世界！\n\n日本語と英語が混在したテキストでも、FuzzTokは正確にトークン数を推定できます。\n数字: 12345\n記号: !@#$%')
  const [model, setModel] = useState<keyof ModelConfigs>('gpt-3.5-turbo')
  const [result, setResult] = useState<any>(null)

  const estimateTokens = () => {
    if (!text.trim()) {
      alert('テキストを入力してください')
      return
    }

    const estimator = createSimpleFuzzyEstimator(modelConfigs, 'gpt-3.5-turbo')
    const estimation = estimator.estimateDetailed(text, model)
    setResult(estimation)
  }

  useEffect(() => {
    estimateTokens()
  }, [])

  const renderBar = (value: number, max: number, width = 20) => {
    const filled = Math.round((value / max) * width)
    return '█'.repeat(filled) + '░'.repeat(width - filled)
  }

  const maxTokens = result ? Math.max(...Object.values(result.breakdown)) : 0

  return (
    <div className="container">
      <header className="header">
        <h1>🚀 @aid-on/fuzztok</h1>
        <p>高速・軽量なファジートークン推定ライブラリ</p>
      </header>

      <div className="demo-container">
        <div className="demo-header">
          <h2>ライブデモ</h2>
          <p>テキストを入力してトークン数を推定してみてください</p>
        </div>
        <div className="demo-content">
          <div className="form-group">
            <label htmlFor="model-select">モデルを選択:</label>
            <select 
              id="model-select" 
              value={model} 
              onChange={(e) => setModel(e.target.value as keyof ModelConfigs)}
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="text-input">テキストを入力:</label>
            <textarea 
              id="text-input"
              placeholder="ここにテキストを入力してください..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          
          <button className="btn" onClick={estimateTokens}>
            トークン数を推定
          </button>
          
          {result && (
            <div className="results">
              <div className="result-item">
                <div className="result-title">推定トークン数</div>
                <div className="result-value">{result.tokens}</div>
              </div>
              
              <div className="breakdown">
                <div className="breakdown-item">
                  <div className="result-title">CJK文字</div>
                  <div className="result-value">{result.breakdown.cjk.toFixed(1)}</div>
                </div>
                <div className="breakdown-item">
                  <div className="result-title">ラテン文字</div>
                  <div className="result-value">{result.breakdown.latin.toFixed(1)}</div>
                </div>
                <div className="breakdown-item">
                  <div className="result-title">数字</div>
                  <div className="result-value">{result.breakdown.digits.toFixed(1)}</div>
                </div>
                <div className="breakdown-item">
                  <div className="result-title">記号</div>
                  <div className="result-value">{result.breakdown.symbols.toFixed(1)}</div>
                </div>
                <div className="breakdown-item">
                  <div className="result-title">オーバーヘッド</div>
                  <div className="result-value">{result.breakdown.overhead}</div>
                </div>
                <div className="breakdown-item">
                  <div className="result-title">信頼度</div>
                  <div className="result-value">{result.confidence}</div>
                </div>
              </div>
              
              <div className="visualization">
                {`=== トークン推定の可視化 ===
モデル: ${result.modelUsed}
テキスト: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"
総トークン数: ${result.tokens}
信頼度: ${result.confidence}

内訳:
CJK       [${renderBar(result.breakdown.cjk, maxTokens)}] ${result.breakdown.cjk.toFixed(1)}
ラテン文字 [${renderBar(result.breakdown.latin, maxTokens)}] ${result.breakdown.latin.toFixed(1)}
数字      [${renderBar(result.breakdown.digits, maxTokens)}] ${result.breakdown.digits.toFixed(1)}
記号      [${renderBar(result.breakdown.symbols, maxTokens)}] ${result.breakdown.symbols.toFixed(1)}
オーバーヘッド [${renderBar(result.breakdown.overhead, maxTokens)}] ${result.breakdown.overhead}

テキスト分析:
- 総文字数: ${result.textAnalysis.totalChars}
- CJK比率: ${(result.textAnalysis.cjkRatio * 100).toFixed(1)}%
- 調整係数: ${result.textAnalysis.adjustmentFactor.toFixed(2)}`}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🚀</div>
          <div className="feature-title">高速パフォーマンス</div>
          <div className="feature-description">速度とメモリ使用量に最適化されたアルゴリズム</div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🌏</div>
          <div className="feature-title">CJKサポート</div>
          <div className="feature-description">中国語、日本語、韓国語テキストの高度なサポート</div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🔧</div>
          <div className="feature-title">柔軟なアーキテクチャ</div>
          <div className="feature-description">依存性注入パターンによるモデル設定の柔軟性</div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <div className="feature-title">詳細な分析</div>
          <div className="feature-description">文字種別の内訳と構成分析</div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <div className="feature-title">バッチ処理</div>
          <div className="feature-description">バッチ推定とストリーミングテキストのサポート</div>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <div className="feature-title">コスト計算</div>
          <div className="feature-description">組み込みのトークン・コスト変換ユーティリティ</div>
        </div>
      </div>

      <footer className="footer">
        <p>Made with ❤️ by <a href="https://github.com/Aid-On/fuzztok" target="_blank" rel="noopener noreferrer">Aid-On</a></p>
        <p>
          <a href="https://github.com/Aid-On/fuzztok" target="_blank" rel="noopener noreferrer">GitHub</a> | 
          <a href="https://www.npmjs.com/package/@aid-on/fuzztok" target="_blank" rel="noopener noreferrer">NPM</a>
        </p>
      </footer>
    </div>
  )
}