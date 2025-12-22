import { Injectable } from '@nestjs/common';

/**
 * Text Similarity Service
 *
 * Calculates similarity between search rawText and listing content.
 * Uses simple but effective word overlap with Turkish text normalization.
 *
 * No external AI APIs required - deterministic and debuggable.
 */
@Injectable()
export class TextSimilarityService {
  // Turkish stopwords to ignore
  private readonly STOPWORDS = new Set([
    'bir',
    've',
    'ile',
    'için',
    'icin',
    'de',
    'da',
    'den',
    'dan',
    'bu',
    'şu',
    'su',
    'o',
    'ki',
    'gibi',
    'kadar',
    'daha',
    'en',
    'çok',
    'cok',
    'az',
    'var',
    'yok',
    'olan',
    'olarak',
    'ama',
    'ancak',
    'veya',
    'ya',
    'hem',
    'ne',
    'nasıl',
    'nasil',
    'neden',
    'hangi',
    'kim',
    'kimin',
    'biz',
    'siz',
    'ben',
    'sen',
    'onlar',
    'bunu',
    'şunu',
    'sunu',
    'onu',
    'buna',
    'şuna',
    'suna',
    'ona',
    'bunun',
    'şunun',
    'sunun',
    'onun',
    'her',
    'tüm',
    'tum',
    'hepsi',
    'bazı',
    'bazi',
    'hiç',
    'hic',
    'sadece',
    'yalnız',
    'yalniz',
    'bile',
    'ise',
    'iken',
    'mi',
    'mu',
    'mü',
    'mı',
    'değil',
    'degil',
    'oldu',
    'olur',
    'olacak',
    'olmuş',
    'olmus',
    'edilir',
    'edilmiş',
    'edilmis',
    'yapılır',
    'yapilir',
    'ayrıca',
    'ayrica',
    'üzere',
    'uzere',
    'bakımından',
    'bakimindan',
  ]);

  // High-value real estate keywords that boost similarity
  private readonly HIGH_VALUE_KEYWORDS = new Set([
    'deniz',
    'manzara',
    'manzaralı',
    'manzarali',
    'bahce',
    'bahçe',
    'bahceli',
    'bahçeli',
    'havuz',
    'havuzlu',
    'site',
    'guvenlik',
    'güvenlik',
    'guvenlikli',
    'güvenlikli',
    'asansor',
    'asansör',
    'asansorlu',
    'asansörlü',
    'otopark',
    'garaj',
    'teras',
    'terasli',
    'teraslı',
    'balkon',
    'balkonlu',
    'esyali',
    'eşyalı',
    'mobilyali',
    'mobilyalı',
    'yeni',
    'sifir',
    'sıfır',
    'luks',
    'lüks',
    'merkezi',
    'metro',
    'metrobus',
    'metrobüs',
    'tramvay',
    'avm',
    'okul',
    'universite',
    'üniversite',
    'hastane',
    'park',
    'yeşil',
    'yesil',
    'doğa',
    'doga',
    'sakin',
    'sessiz',
    'ferah',
    'aydınlık',
    'aydinlik',
    'geniş',
    'genis',
    'cadde',
    'sokak',
  ]);

  /**
   * Calculate similarity score between search text and listing content
   * Returns a score from 0 to 100
   */
  calculateSimilarity(
    rawText: string,
    listingTitle: string,
    listingDescription?: string | null,
  ): number {
    if (!rawText || rawText.trim().length === 0) {
      return 0;
    }

    // Tokenize and normalize
    const searchTokens = this.tokenize(rawText);
    const titleTokens = this.tokenize(listingTitle || '');
    const descTokens = this.tokenize(listingDescription || '');

    // Combine listing tokens
    const listingTokens = new Set([...titleTokens, ...descTokens]);

    if (searchTokens.length === 0 || listingTokens.size === 0) {
      return 0;
    }

    // Calculate weighted overlap
    let matchScore = 0;
    let maxPossibleScore = 0;

    for (const token of searchTokens) {
      const weight = this.HIGH_VALUE_KEYWORDS.has(token) ? 2.0 : 1.0;
      maxPossibleScore += weight;

      if (listingTokens.has(token)) {
        matchScore += weight;
      } else {
        // Partial matching for similar words
        const partialMatch = this.findPartialMatch(token, listingTokens);
        if (partialMatch > 0) {
          matchScore += weight * partialMatch;
        }
      }
    }

    // Calculate base score (0-70 points from word overlap)
    const overlapScore =
      maxPossibleScore > 0 ? (matchScore / maxPossibleScore) * 70 : 0;

    // Bonus for title matches (0-30 points)
    const titleBonus = this.calculateTitleBonus(searchTokens, titleTokens);

    const totalScore = Math.min(100, Math.round(overlapScore + titleBonus));

    return totalScore;
  }

  /**
   * Tokenize and normalize Turkish text
   */
  private tokenize(text: string): string[] {
    // Normalize Turkish characters and lowercase
    const normalized = text
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[''`]/g, '')
      .replace(/[""]/g, '');

    // Split by non-word characters
    const words = normalized.split(/[^a-z0-9]+/).filter((w) => w.length >= 2);

    // Remove stopwords
    return words.filter((w) => !this.STOPWORDS.has(w));
  }

  /**
   * Find partial match for token in listing tokens
   * Returns 0-1 score based on match quality
   */
  private findPartialMatch(token: string, listingTokens: Set<string>): number {
    // Skip very short tokens for partial matching
    if (token.length < 4) {
      return 0;
    }

    for (const listingToken of listingTokens) {
      // Prefix match (e.g., "bahce" matches "bahceli")
      if (listingToken.startsWith(token) || token.startsWith(listingToken)) {
        return 0.7;
      }

      // Substring match
      if (listingToken.includes(token) || token.includes(listingToken)) {
        return 0.5;
      }

      // Levenshtein distance for typo tolerance (only for similar length words)
      if (Math.abs(token.length - listingToken.length) <= 2) {
        const distance = this.levenshteinDistance(token, listingToken);
        if (distance <= 2) {
          return 0.6 - distance * 0.2;
        }
      }
    }

    return 0;
  }

  /**
   * Calculate bonus score for matches in listing title
   * Title matches are more valuable than description matches
   */
  private calculateTitleBonus(
    searchTokens: string[],
    titleTokens: string[],
  ): number {
    if (searchTokens.length === 0 || titleTokens.length === 0) {
      return 0;
    }

    const titleSet = new Set(titleTokens);
    let matches = 0;

    for (const token of searchTokens) {
      if (titleSet.has(token)) {
        matches++;
      } else {
        // Check for partial matches in title
        for (const titleToken of titleSet) {
          if (
            titleToken.includes(token) ||
            token.includes(titleToken) ||
            titleToken.startsWith(token) ||
            token.startsWith(titleToken)
          ) {
            matches += 0.5;
            break;
          }
        }
      }
    }

    // Max 30 points for title bonus
    return Math.min(30, (matches / searchTokens.length) * 30);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;

    // Optimization for obvious cases
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;
    if (s1 === s2) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate similarity with detailed breakdown for debugging
   */
  calculateSimilarityWithBreakdown(
    rawText: string,
    listingTitle: string,
    listingDescription?: string | null,
  ): {
    score: number;
    searchTokens: string[];
    matchedTokens: string[];
    titleMatches: string[];
  } {
    const searchTokens = this.tokenize(rawText);
    const titleTokens = this.tokenize(listingTitle || '');
    const descTokens = this.tokenize(listingDescription || '');
    const listingTokens = new Set([...titleTokens, ...descTokens]);

    const matchedTokens: string[] = [];
    const titleMatches: string[] = [];

    for (const token of searchTokens) {
      if (listingTokens.has(token)) {
        matchedTokens.push(token);
        if (titleTokens.includes(token)) {
          titleMatches.push(token);
        }
      }
    }

    return {
      score: this.calculateSimilarity(rawText, listingTitle, listingDescription),
      searchTokens,
      matchedTokens,
      titleMatches,
    };
  }
}
