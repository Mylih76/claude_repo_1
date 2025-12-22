import { Injectable } from '@nestjs/common';

/**
 * Extracted criteria from rawText parsing
 */
export interface ExtractedCriteria {
  cities: string[];
  districts: string[];
  neighborhoods: string[];
  budgetMin?: number;
  budgetMax?: number;
  roomCountMin?: string;
  roomCountMax?: string;
  propertyTypes: string[];
  listingType?: 'sale' | 'rent';
  features: string[];
}

/**
 * Turkish Text Parser Service
 *
 * Extracts structured search criteria from natural language Turkish text.
 * Designed for WhatsApp integration where users send free-form messages.
 *
 * Example inputs:
 * - "Beşiktaş'ta 3+1, 25 milyon altı, deniz manzaralı bir ev arıyorum"
 * - "Kadıköy'de kiralık 2+1 daire, max 30 bin"
 * - "İstanbul Ataşehir'de satılık villa, bahçeli, 50 milyon civarı"
 */
@Injectable()
export class TextParserService {
  // Major Turkish cities
  private readonly CITIES = [
    'istanbul',
    'ankara',
    'izmir',
    'antalya',
    'bursa',
    'adana',
    'gaziantep',
    'konya',
    'mersin',
    'kayseri',
    'eskişehir',
    'trabzon',
    'samsun',
    'denizli',
    'muğla',
    'bodrum',
    'fethiye',
  ];

  // Istanbul districts (most common)
  private readonly ISTANBUL_DISTRICTS = [
    'kadıköy',
    'beşiktaş',
    'şişli',
    'beyoğlu',
    'üsküdar',
    'ataşehir',
    'maltepe',
    'kartal',
    'pendik',
    'bakırköy',
    'bahçelievler',
    'bağcılar',
    'küçükçekmece',
    'beylikdüzü',
    'esenyurt',
    'başakşehir',
    'sarıyer',
    'beykoz',
    'fatih',
    'zeytinburnu',
    'güngören',
    'esenler',
    'bayrampaşa',
    'eyüpsultan',
    'gaziosmanpaşa',
    'kağıthane',
    'sultangazi',
    'arnavutköy',
    'çatalca',
    'silivri',
    'büyükçekmece',
    'avcılar',
    'tuzla',
    'çekmeköy',
    'sancaktepe',
    'sultanbeyli',
    'ümraniye',
    'adalar',
    'şile',
  ];

  // Ankara districts
  private readonly ANKARA_DISTRICTS = [
    'çankaya',
    'keçiören',
    'yenimahalle',
    'mamak',
    'etimesgut',
    'sincan',
    'altındağ',
    'pursaklar',
    'gölbaşı',
    'polatlı',
  ];

  // Izmir districts
  private readonly IZMIR_DISTRICTS = [
    'konak',
    'karşıyaka',
    'bornova',
    'buca',
    'çiğli',
    'gaziemir',
    'bayraklı',
    'karabağlar',
    'narlıdere',
    'balçova',
    'güzelbahçe',
    'urla',
    'çeşme',
    'aliağa',
    'foça',
    'seferihisar',
    'menderes',
    'torbalı',
    'kemalpaşa',
  ];

  // Property types
  private readonly PROPERTY_TYPES: Record<string, string> = {
    daire: 'apartment',
    apartman: 'apartment',
    villa: 'villa',
    müstakil: 'detached_house',
    'müstakil ev': 'detached_house',
    ev: 'detached_house',
    rezidans: 'residence',
    'yazlık': 'summer_house',
    çatı: 'penthouse',
    'çatı katı': 'penthouse',
    dublex: 'duplex',
    triplex: 'triplex',
    stüdyo: 'studio',
  };

  // Feature keywords
  private readonly FEATURES: Record<string, string> = {
    'deniz manzara': 'sea_view',
    'deniz manzaralı': 'sea_view',
    bahçe: 'garden',
    bahçeli: 'garden',
    'site içi': 'in_complex',
    siteiçi: 'in_complex',
    site: 'in_complex',
    havuz: 'pool',
    havuzlu: 'pool',
    asansör: 'elevator',
    asansörlü: 'elevator',
    otopark: 'parking',
    garaj: 'garage',
    güvenlik: 'security',
    'güvenlikli': 'security',
    eşyalı: 'furnished',
    mobilyalı: 'furnished',
    'boş': 'unfurnished',
    kombili: 'central_heating',
    kombi: 'central_heating',
    doğalgaz: 'natural_gas',
    'klima': 'air_conditioning',
    'klimali': 'air_conditioning',
    balkon: 'balcony',
    balkonlu: 'balcony',
    teras: 'terrace',
    teraslı: 'terrace',
    'açık mutfak': 'open_kitchen',
    'kapalı mutfak': 'closed_kitchen',
    'akıllı ev': 'smart_home',
    'jeneratör': 'generator',
  };

  /**
   * Parse Turkish natural language text and extract search criteria
   */
  parse(rawText: string): ExtractedCriteria {
    const normalized = this.normalize(rawText);

    return {
      cities: this.extractCities(normalized),
      districts: this.extractDistricts(normalized),
      neighborhoods: [], // Could be expanded later
      budgetMin: this.extractBudgetMin(normalized),
      budgetMax: this.extractBudgetMax(normalized),
      roomCountMin: this.extractRoomCount(normalized),
      roomCountMax: this.extractRoomCount(normalized),
      propertyTypes: this.extractPropertyTypes(normalized),
      listingType: this.extractListingType(normalized),
      features: this.extractFeatures(normalized),
    };
  }

  /**
   * Normalize Turkish text for matching
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[''`]/g, "'")
      .replace(/[""]/g, '"')
      .trim();
  }

  /**
   * Normalize a city/district name for matching
   */
  private normalizeLocation(name: string): string {
    return this.normalize(name);
  }

  /**
   * Extract city names from text
   */
  private extractCities(text: string): string[] {
    const cities: string[] = [];

    for (const city of this.CITIES) {
      const normalizedCity = this.normalizeLocation(city);
      // Match with word boundaries, apostrophes, or possessive suffixes
      const patterns = [
        new RegExp(`\\b${normalizedCity}\\b`, 'i'),
        new RegExp(`${normalizedCity}'`, 'i'),
        new RegExp(`${normalizedCity}da\\b`, 'i'),
        new RegExp(`${normalizedCity}de\\b`, 'i'),
        new RegExp(`${normalizedCity}'da\\b`, 'i'),
        new RegExp(`${normalizedCity}'de\\b`, 'i'),
      ];

      if (patterns.some((p) => p.test(text))) {
        // Return original (non-normalized) city name with proper casing
        cities.push(this.capitalizeCity(city));
      }
    }

    return cities;
  }

  /**
   * Extract district names from text
   */
  private extractDistricts(text: string): string[] {
    const districts: string[] = [];
    const allDistricts = [
      ...this.ISTANBUL_DISTRICTS,
      ...this.ANKARA_DISTRICTS,
      ...this.IZMIR_DISTRICTS,
    ];

    for (const district of allDistricts) {
      const normalizedDistrict = this.normalizeLocation(district);
      const patterns = [
        new RegExp(`\\b${normalizedDistrict}\\b`, 'i'),
        new RegExp(`${normalizedDistrict}'`, 'i'),
        new RegExp(`${normalizedDistrict}da\\b`, 'i'),
        new RegExp(`${normalizedDistrict}de\\b`, 'i'),
        new RegExp(`${normalizedDistrict}'da\\b`, 'i'),
        new RegExp(`${normalizedDistrict}'de\\b`, 'i'),
      ];

      if (patterns.some((p) => p.test(text))) {
        districts.push(this.capitalizeCity(district));
      }
    }

    return districts;
  }

  /**
   * Capitalize city/district names properly
   */
  private capitalizeCity(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract minimum budget from text
   */
  private extractBudgetMin(text: string): number | undefined {
    // Patterns for minimum price
    // "10-15 milyon arası" → min: 10M
    // "en az 5 milyon" → min: 5M
    // "5 milyondan fazla" → min: 5M

    const rangeMatch = text.match(
      /(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)/i,
    );
    if (rangeMatch) {
      return this.parsePrice(rangeMatch[1], rangeMatch[3]);
    }

    const minPatterns = [
      /en\s*az\s*(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?/i,
      /(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?\s*(?:den|dan)\s*fazla/i,
      /minimum\s*(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?/i,
    ];

    for (const pattern of minPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.parsePrice(match[1], match[2] || 'milyon');
      }
    }

    return undefined;
  }

  /**
   * Extract maximum budget from text
   */
  private extractBudgetMax(text: string): number | undefined {
    // Patterns for maximum price
    // "25 milyon altı" → max: 25M
    // "max 30 bin" → max: 30K (for rent)
    // "10-15 milyon arası" → max: 15M
    // "50 milyon civarı" → max: 55M (10% buffer)

    const rangeMatch = text.match(
      /(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)/i,
    );
    if (rangeMatch) {
      return this.parsePrice(rangeMatch[2], rangeMatch[3]);
    }

    const maxPatterns = [
      /(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?\s*(?:alti|altı|altinda|altında)/i,
      /max(?:imum)?\s*(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?/i,
      /en\s*fazla\s*(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?/i,
      /(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?\s*(?:a|e)\s*kadar/i,
      /butce(?:m)?\s*(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?/i,
    ];

    for (const pattern of maxPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.parsePrice(match[1], match[2] || 'milyon');
      }
    }

    // "civarı" pattern - add 10% buffer
    const ciraviMatch = text.match(
      /(\d+(?:[.,]\d+)?)\s*(milyon|miliar|bin|k|m|tl)?\s*(?:civari|civarı|dolayları|kadar)/i,
    );
    if (ciraviMatch) {
      const base = this.parsePrice(ciraviMatch[1], ciraviMatch[2] || 'milyon');
      return base ? Math.round(base * 1.1) : undefined;
    }

    // Standalone number with milyon (assume max if no other context)
    const standaloneMatch = text.match(
      /(\d+(?:[.,]\d+)?)\s*(milyon|miliar)\b(?!\s*(?:den|dan|ustu|üstü))/i,
    );
    if (standaloneMatch && !this.extractBudgetMin(text)) {
      return this.parsePrice(standaloneMatch[1], standaloneMatch[2]);
    }

    return undefined;
  }

  /**
   * Parse price string to number
   */
  private parsePrice(value: string, unit?: string): number | undefined {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return undefined;

    const normalizedUnit = (unit || '').toLowerCase();

    if (normalizedUnit.includes('miliar') || normalizedUnit === 'b') {
      return num * 1_000_000_000;
    }
    if (
      normalizedUnit.includes('milyon') ||
      normalizedUnit === 'm' ||
      normalizedUnit === ''
    ) {
      return num * 1_000_000;
    }
    if (normalizedUnit.includes('bin') || normalizedUnit === 'k') {
      return num * 1_000;
    }
    if (normalizedUnit === 'tl') {
      // Assume the number represents the actual value
      return num >= 1000 ? num : num * 1_000_000;
    }

    // Default to millions for Turkish real estate
    return num * 1_000_000;
  }

  /**
   * Extract room count from text
   */
  private extractRoomCount(text: string): string | undefined {
    // Match patterns like "3+1", "2+1", "1+0", "stüdyo"
    const roomMatch = text.match(/(\d)\s*\+\s*(\d)/);
    if (roomMatch) {
      return `${roomMatch[1]}+${roomMatch[2]}`;
    }

    // Match "3 oda" or "3 odalı"
    const odaMatch = text.match(/(\d)\s*oda/i);
    if (odaMatch) {
      return `${odaMatch[1]}+1`;
    }

    // Studio
    if (/st[uü]dyo/i.test(text)) {
      return '1+0';
    }

    return undefined;
  }

  /**
   * Extract property types from text
   */
  private extractPropertyTypes(text: string): string[] {
    const types: string[] = [];

    for (const [keyword, type] of Object.entries(this.PROPERTY_TYPES)) {
      const normalizedKeyword = this.normalize(keyword);
      if (text.includes(normalizedKeyword)) {
        if (!types.includes(type)) {
          types.push(type);
        }
      }
    }

    return types;
  }

  /**
   * Extract listing type (sale/rent) from text
   */
  private extractListingType(text: string): 'sale' | 'rent' | undefined {
    const salePatterns = [
      /satilik/i,
      /satılık/i,
      /satin\s*al/i,
      /satın\s*al/i,
      /almak/i,
    ];

    const rentPatterns = [/kiralik/i, /kiralık/i, /kira/i, /kirala/i];

    if (salePatterns.some((p) => p.test(text))) {
      return 'sale';
    }

    if (rentPatterns.some((p) => p.test(text))) {
      return 'rent';
    }

    return undefined;
  }

  /**
   * Extract features from text
   */
  private extractFeatures(text: string): string[] {
    const features: string[] = [];

    for (const [keyword, feature] of Object.entries(this.FEATURES)) {
      const normalizedKeyword = this.normalize(keyword);
      if (text.includes(normalizedKeyword)) {
        if (!features.includes(feature)) {
          features.push(feature);
        }
      }
    }

    return features;
  }
}
