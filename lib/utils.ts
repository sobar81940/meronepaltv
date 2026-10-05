import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strips HTML tags from a string and returns plain text
 * Useful for displaying excerpts without HTML formatting
 */
export function stripHtmlTags(html: string | undefined | null): string {
  if (!html) return "";

  // Remove script and style tags and their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Replace common HTML tags with their content or appropriate spacing
  text = text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<p[^>]*>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<div[^>]*>/gi, " ")
    .replace(/<\/div>/gi, " ")
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<strong[^>]*>/gi, "")
    .replace(/<\/strong>/gi, "")
    .replace(/<b[^>]*>/gi, "")
    .replace(/<\/b>/gi, "")
    .replace(/<em[^>]*>/gi, "")
    .replace(/<\/em>/gi, "")
    .replace(/<i[^>]*>/gi, "")
    .replace(/<\/i>/gi, "")
    .replace(/<u[^>]*>/gi, "")
    .replace(/<\/u>/gi, "")
    .replace(/<a[^>]*>/gi, "")
    .replace(/<\/a>/gi, "")
    .replace(/<img[^>]*>/gi, " [Image] ")
    .replace(/<h[1-6][^>]*>/gi, " ")
    .replace(/<\/h[1-6]>/gi, " ")
    .replace(/<ul[^>]*>/gi, " ")
    .replace(/<\/ul>/gi, " ")
    .replace(/<ol[^>]*>/gi, " ")
    .replace(/<\/ol>/gi, " ")
    .replace(/<li[^>]*>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<blockquote[^>]*>/gi, " ")
    .replace(/<\/blockquote>/gi, " ")
    .replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up multiple spaces
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Converts Nepali text to Roman transliteration for URL slugs
 * Example: "विजनेस" → "bijness"
 */
export function nepaliToRoman(nepaliText: string): string {
  if (!nepaliText) return "";

  const nepaliToRomanMap: Record<string, string> = {
    // Vowels
    'अ': 'a',
    'आ': 'aa',
    'इ': 'i',
    'ई': 'ee',
    'उ': 'u',
    'ऊ': 'uu',
    'ऋ': 'ri',
    'ए': 'e',
    'ऐ': 'ai',
    'ओ': 'o',
    'औ': 'au',

    // Consonants
    'क': 'k',
    'ख': 'kh',
    'ग': 'g',
    'घ': 'gh',
    'ङ': 'ng',
    'च': 'ch',
    'छ': 'chh',
    'ज': 'j',
    'झ': 'jh',
    'ञ': 'ny',
    'ट': 'th',
    'ठ': 'thh',
    'ड': 'd',
    'ढ': 'dh',
    'ण': 'n',
    'त': 't',
    'थ': 'th',
    'द': 'd',
    'ध': 'dh',
    'न': 'n',
    'प': 'p',
    'फ': 'ph',
    'ब': 'b',
    'भ': 'bh',
    'म': 'm',
    'य': 'y',
    'र': 'r',
    'ल': 'l',
    'व': 'w',
    'श': 'sh',
    'ष': 'sh',
    'स': 's',
    'ह': 'h',
    'क्ष': 'ksh',
    'त्र': 'tr',
    'ज्ञ': 'gy',

    // Vowel diacritics
    'ा': 'a',
    'ि': 'i',
    'ी': 'ee',
    'ु': 'u',
    'ू': 'uu',
    'ृ': 'ri',
    'े': 'e',
    'ै': 'ai',
    'ो': 'o',
    'ौ': 'au',
    'ं': 'n',
    'ः': 'h',
    'ँ': 'n',
  };

  let roman = '';
  for (const char of nepaliText) {
    roman += nepaliToRomanMap[char] || char;
  }

  return roman
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}
