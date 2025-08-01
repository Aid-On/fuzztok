import { describe, it, expect } from 'vitest';
import { CharacterClassifier } from '../index.js';

describe('CharacterClassifier', () => {
  describe('isCJKCharacter', () => {
    it('should identify Japanese characters correctly', () => {
      expect(CharacterClassifier.isCJKCharacter('あ')).toBe(true); // ひらがな
      expect(CharacterClassifier.isCJKCharacter('ア')).toBe(true); // カタカナ
      expect(CharacterClassifier.isCJKCharacter('漢')).toBe(true); // 漢字
      expect(CharacterClassifier.isCJKCharacter('。')).toBe(true); // 句読点
    });

    it('should identify Chinese characters correctly', () => {
      expect(CharacterClassifier.isCJKCharacter('中')).toBe(true);
      expect(CharacterClassifier.isCJKCharacter('文')).toBe(true);
      expect(CharacterClassifier.isCJKCharacter('你')).toBe(true);
      expect(CharacterClassifier.isCJKCharacter('好')).toBe(true);
    });

    it('should identify Korean characters correctly', () => {
      expect(CharacterClassifier.isCJKCharacter('한')).toBe(true);
      expect(CharacterClassifier.isCJKCharacter('글')).toBe(true);
      expect(CharacterClassifier.isCJKCharacter('안')).toBe(true);
      expect(CharacterClassifier.isCJKCharacter('녕')).toBe(true);
    });

    it('should reject non-CJK characters', () => {
      expect(CharacterClassifier.isCJKCharacter('a')).toBe(false);
      expect(CharacterClassifier.isCJKCharacter('1')).toBe(false);
      expect(CharacterClassifier.isCJKCharacter(' ')).toBe(false);
      expect(CharacterClassifier.isCJKCharacter('!')).toBe(false);
    });
  });

  describe('getCharacterType', () => {
    it('should classify CJK characters', () => {
      expect(CharacterClassifier.getCharacterType('あ')).toBe('cjk');
      expect(CharacterClassifier.getCharacterType('中')).toBe('cjk');
      expect(CharacterClassifier.getCharacterType('한')).toBe('cjk');
    });

    it('should classify Latin characters', () => {
      expect(CharacterClassifier.getCharacterType('a')).toBe('latin');
      expect(CharacterClassifier.getCharacterType('Z')).toBe('latin');
      expect(CharacterClassifier.getCharacterType('é')).toBe('latin'); // 拡張ラテン
    });

    it('should classify digits', () => {
      expect(CharacterClassifier.getCharacterType('0')).toBe('digit');
      expect(CharacterClassifier.getCharacterType('9')).toBe('digit');
      expect(CharacterClassifier.getCharacterType('٠')).toBe('digit'); // アラビア数字
    });

    it('should classify whitespace', () => {
      expect(CharacterClassifier.getCharacterType(' ')).toBe('whitespace');
      expect(CharacterClassifier.getCharacterType('\t')).toBe('whitespace');
      expect(CharacterClassifier.getCharacterType('\n')).toBe('whitespace');
    });

    it('should classify symbols', () => {
      expect(CharacterClassifier.getCharacterType('!')).toBe('symbol');
      expect(CharacterClassifier.getCharacterType('@')).toBe('symbol');
      expect(CharacterClassifier.getCharacterType('★')).toBe('symbol');
    });
  });

  describe('analyzeTextComposition', () => {
    it('should analyze pure English text', () => {
      const result = CharacterClassifier.analyzeTextComposition('Hello World');
      expect(result.cjk).toBe(0);
      expect(result.latin).toBe(10);
      expect(result.whitespace).toBe(1);
      expect(result.total).toBe(11);
      expect(result.cjkRatio).toBe(0);
    });

    it('should analyze pure Japanese text', () => {
      const result = CharacterClassifier.analyzeTextComposition('こんにちは');
      expect(result.cjk).toBe(5);
      expect(result.latin).toBe(0);
      expect(result.total).toBe(5);
      expect(result.cjkRatio).toBe(1);
    });

    it('should analyze mixed text', () => {
      const result = CharacterClassifier.analyzeTextComposition('Hello こんにちは 123');
      expect(result.cjk).toBe(5);
      expect(result.latin).toBe(5);
      expect(result.digits).toBe(3);
      expect(result.whitespace).toBe(2);
      expect(result.total).toBe(15);
      expect(result.cjkRatio).toBe(5/15);
    });

    it('should handle empty text', () => {
      const result = CharacterClassifier.analyzeTextComposition('');
      expect(result.total).toBe(0);
      expect(result.cjkRatio).toBe(0);
    });

    it('should analyze text with symbols', () => {
      const result = CharacterClassifier.analyzeTextComposition('Hello! こんにちは★');
      expect(result.latin).toBe(5);
      expect(result.cjk).toBe(5);
      expect(result.symbols).toBe(2);
      expect(result.total).toBe(13);
    });
  });
});
