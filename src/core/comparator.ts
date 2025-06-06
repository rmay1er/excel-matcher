import { get as distance } from "fast-levenshtein";
import type { ComparisonResult } from "../types/types";

export class Comparator {
  private static cache = new Map<string, number>();
  private static MAX_CACHE_SIZE = 200000;

  static calculateSimilarity(a: string, b: string): number {
    const cacheKey = `${a}|${b}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Ограничиваем размер кеша, если достигнут лимит, очищаем
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cache.clear();
    }

    // Разбиваем на слова и учитываем частичные совпадения
    const wordsA = a.split(/\s+/).filter(Boolean);
    const wordsB = b.split(/\s+/).filter(Boolean);

    const maxWords = Math.max(wordsA.length, wordsB.length);
    if (maxWords === 0) return 1.0;

    // Считаем схожесть по словам
    const wordSimilarity =
      wordsA.reduce((sum, wordA) => {
        const bestMatch = wordsB.reduce((max, wordB) => {
          const dist = distance(wordA, wordB);
          const len = Math.max(wordA.length, wordB.length);
          return Math.max(max, 1 - dist / len);
        }, 0);
        return sum + bestMatch;
      }, 0) / maxWords;

    this.cache.set(cacheKey, wordSimilarity);
    return wordSimilarity;
  }

  static preFilter(a: string, b: string, threshold: number): boolean {
    // Быстрая проверка общих слов
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const commonWords = [...wordsA].filter((word) => wordsB.has(word));

    // Если есть хотя бы одно общее слово - пропускаем
    if (commonWords.length > 0) return true;

    // Проверяем длину общего префикса для ускоренной фильтрации
    const minLen = Math.min(a.length, b.length);
    if (minLen === 0) return false;

    let commonPrefixLength = 0;
    for (let i = 0; i < minLen; i++) {
      if (a[i] === b[i]) {
        commonPrefixLength++;
      } else {
        break;
      }
    }

    if (commonPrefixLength / minLen < threshold * 0.5) {
      return false;
    }

    // Остальная логика проверки
    const maxLen = Math.max(a.length, b.length);
    return minLen / maxLen >= threshold * 0.8;
  }

  static isMatch(a: string, b: string, threshold: number): ComparisonResult {
    if (!this.preFilter(a, b, threshold)) {
      return { match: false, similarity: 0 };
    }
    const similarity = this.calculateSimilarity(a, b);
    return { match: similarity >= threshold, similarity };
  }
}
