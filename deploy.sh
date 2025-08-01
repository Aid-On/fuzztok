#!/bin/bash

# GitHub Pages デプロイスクリプト

echo "🚀 FuzzTok GitHub Pages デプロイを開始します..."

# 現在のブランチを確認
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "現在のブランチ: $current_branch"

# mainブランチにいるかチェック
if [ "$current_branch" != "main" ]; then
    echo "⚠️  mainブランチからデプロイしてください"
    exit 1
fi

# 未コミットの変更があるかチェック
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  未コミットの変更があります。先にコミットしてください"
    git status
    exit 1
fi

# 依存関係をインストール
echo "📦 依存関係をインストール中..."
npm ci

# テストを実行
echo "🧪 テストを実行中..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ テストが失敗しました"
    exit 1
fi

# ビルドを実行
echo "🔨 ビルドを実行中..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ビルドが失敗しました"
    exit 1
fi

# リモートにプッシュ
echo "📤 変更をリモートにプッシュ中..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ プッシュが失敗しました"
    exit 1
fi

echo "✅ デプロイが完了しました！"
echo "🌐 デモページ: https://aid-on.github.io/fuzztok/"
echo "📖 GitHub Actions でのデプロイ状況を確認してください: https://github.com/Aid-On/fuzztok/actions"