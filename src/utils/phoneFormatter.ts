// Phone number formatting utility for international numbers
// Supports major countries with automatic country code detection

interface CountryRule {
  name: string;
  pattern: RegExp;
  format: string;
  minLength: number;
  maxLength: number;
}

const COUNTRY_RULES: Record<string, CountryRule> = {
  '+1': {
    name: 'USA/Canada',
    pattern: /(\d{3})(\d{3})(\d{4})/,
    format: '($1) $2-$3',
    minLength: 10,
    maxLength: 11, // Including country code
  },
  '+7': {
    name: 'Russia',
    pattern: /(\d{3})(\d{3})(\d{2})(\d{2})/,
    format: '+7 $1 $2-$3-$4',
    minLength: 11,
    maxLength: 12, // Including country code
  },
  '+86': {
    name: 'China',
    pattern: /(\d{3})(\d{4})(\d{4})/,
    format: '+86 $1 $2 $3',
    minLength: 11,
    maxLength: 12, // Including country code
  },
  '+998': {
    name: 'Uzbekistan',
    pattern: /(\d{2})(\d{3})(\d{2})(\d{2})/,
    format: '+998 $1 $2-$3-$4',
    minLength: 12,
    maxLength: 13, // Including country code
  },
  '+44': {
    name: 'UK',
    pattern: /(\d{2})(\d{4})(\d{4})/,
    format: '+44 $1 $2 $3',
    minLength: 10,
    maxLength: 12, // Including country code
  },
  '+49': {
    name: 'Germany',
    pattern: /(\d{3,4})(\d{7,8})/,
    format: '+49 $1 $2',
    minLength: 11,
    maxLength: 13, // Including country code
  },
  '+33': {
    name: 'France',
    pattern: /(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/,
    format: '+33 $1 $2 $3 $4 $5',
    minLength: 9,
    maxLength: 11, // Including country code
  },
  '+39': {
    name: 'Italy',
    pattern: /(\d{3})(\d{3})(\d{4})/,
    format: '+39 $1 $2 $3',
    minLength: 10,
    maxLength: 12, // Including country code
  },
  '+34': {
    name: 'Spain',
    pattern: /(\d{3})(\d{3})(\d{3})/,
    format: '+34 $1 $2 $3',
    minLength: 9,
    maxLength: 11, // Including country code
  },
  '+91': {
    name: 'India',
    pattern: /(\d{5})(\d{5})/,
    format: '+91 $1 $2',
    minLength: 10,
    maxLength: 12, // Including country code
  },
  '+55': {
    name: 'Brazil',
    pattern: /(\d{2})(\d{4,5})(\d{4})/,
    format: '+55 $1 $2-$3',
    minLength: 11,
    maxLength: 13, // Including country code
  },
  '+81': {
    name: 'Japan',
    pattern: /(\d{3})(\d{4})(\d{4})/,
    format: '+81 $1 $2 $3',
    minLength: 10,
    maxLength: 11, // Including country code
  },
};

/**
 * Detect country code from phone number
 */
export const detectCountryCode = (phone: string): string => {
  if (!phone) return '';

  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  // Check for known country codes in order of specificity (longer codes first)
  const sortedCodes = Object.keys(COUNTRY_RULES).sort((a, b) => b.length - a.length);

  for (const code of sortedCodes) {
    if (cleanPhone.startsWith(code)) {
      return code;
    }
  }

  // If no known code found, try to extract a generic +XXX pattern
  const match = cleanPhone.match(/^\+(\d{1,3})/);
  return match ? `+${match[1]}` : '';
};

/**
 * Validate phone number according to country rules
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;

  const countryCode = detectCountryCode(phone);
  const rule = COUNTRY_RULES[countryCode];

  if (!rule) {
    // For unknown countries, basic validation
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }

  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length >= rule.minLength && cleanPhone.length <= rule.maxLength;
};

/**
 * Format phone number according to country rules
 */
export const formatPhoneNumber = (phone: string | null): string => {
  if (!phone || !phone.trim()) {
    return 'Не указан';
  }

  const countryCode = detectCountryCode(phone);
  const rule = COUNTRY_RULES[countryCode];

  // Remove all non-digit characters
  let cleanPhone = phone.replace(/[^\d]/g, '');

  // Remove country code for formatting
  if (countryCode && cleanPhone.startsWith(countryCode.replace('+', ''))) {
    cleanPhone = cleanPhone.substring(countryCode.length - 1);
  }

  if (!rule) {
    // Generic formatting for unknown countries
    if (cleanPhone.length > 0) {
      const detectedCode = detectCountryCode(phone);
      if (detectedCode) {
        return `${detectedCode} ${cleanPhone}`;
      } else {
        // Basic formatting for unknown codes
        if (cleanPhone.length <= 3) return cleanPhone;
        if (cleanPhone.length <= 6) return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3)}`;
        if (cleanPhone.length <= 8) return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
        return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 9)} ${cleanPhone.slice(9)}`;
      }
    }
    return phone;
  }

  // Apply country-specific formatting
  const match = cleanPhone.match(rule.pattern);
  if (match) {
    return rule.format.replace(/\$(\d+)/g, (_, index) => match[parseInt(index)] || '');
  }

  // Fallback: return with country code and basic spacing
  return `${countryCode} ${cleanPhone}`;
};

/**
 * Get country name from phone number
 */
export const getCountryName = (phone: string): string => {
  const countryCode = detectCountryCode(phone);
  const rule = COUNTRY_RULES[countryCode];
  return rule ? rule.name : 'Unknown';
};

/**
 * Format phone number for input (real-time formatting)
 */
export const formatPhoneInput = (input: string): string => {
  if (!input) return '';

  // Remove all non-digit characters
  let cleanInput = input.replace(/[^\d]/g, '');

  // Auto-add + if missing and number starts with valid country code pattern
  if (!cleanInput.startsWith('+') && cleanInput.length > 0) {
    // Check if this looks like a country code
    if (cleanInput.length >= 1 && cleanInput.length <= 3) {
      // Don't auto-add +, let user type it explicitly for clarity
    }
  }

  // For now, return as-is (real-time formatting can be added later)
  return input;
};

/**
 * Sanitize phone number to the format: + and digits only
 * Example: "+1 (771) 227-1936" => "+17712271936"
 * Example: "+998 99 495 85 14" => "+998994958514"
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Remove all characters except digits and +
  let sanitized = phone.replace(/[^\d+]/g, '');

  // Ensure only one + at the beginning
  if (sanitized.includes('+')) {
    // Remove all + signs first
    sanitized = sanitized.replace(/\+/g, '');
    // Add single + at the beginning
    sanitized = '+' + sanitized;
  }

  return sanitized;
};
