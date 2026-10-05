/**
 * Unicode to Preeti Font Converter
 * Converts Nepali Unicode text to Preeti ASCII font format
 */

// Character mapping from Unicode to Preeti
const unicodeToPreetiMap: Record<string, string> = {
    // Vowels
    'अ': 'c',
    'आ': 'cf',
    'इ': 'O',
    'ई': 'O{',
    'उ': 'p',
    'ऊ': 'pm',
    'ऋ': 'C',
    'ए': 'P',
    'ऐ': 'P]',
    'ओ': 'cf]',
    'औ': 'cf}',

    // Consonants
    'क': 's',
    'ख': 'v',
    'ग': 'u',
    'घ': '3',
    'ङ': '·',
    'च': 'r',
    'छ': 'R',
    'ज': 'h',
    'झ': '´',
    'ञ': '!',
    'ट': '6',
    'ठ': '7',
    'ड': '8',
    'ढ': '9',
    'ण': '0f',
    'त': 't',
    'थ': 'y',
    'द': 'b',
    'ध': 'w',
    'न': 'g',
    'प': 'k',
    'फ': 'km',
    'ब': 'a',
    'भ': 'e',
    'म': 'd',
    'य': 'o',
    'र': 'n',
    'ल': 'n',
    'व': 'j',
    'श': 'z',
    'ष': 'if',
    'स': 'x',
    'ह': 'x',
    'क्ष': 'If',
    'त्र': 'q',
    'ज्ञ': ' 1',

    // Matras (dependent vowel signs)
    'ा': 'f',
    'ि': 'l',
    'ी': 'L',
    'ु': 'u',
    'ू': 'M',
    'ृ': 'Í',
    'े': ']',
    'ै': ']}',
    'ो': 'f]',
    'ौ': 'f}',
    'ं': '+',
    'ः': 'M',
    'ँ': '¬',
    '्': '\\u094D',

    // Numbers
    '०': ')',
    '१': '!',
    '२': '@',
    '३': '#',
    '४': '$',
    '५': '%',
    '६': '^',
    '७': '&',
    '८': '*',
    '९': '(',

    // Special characters
    '।': '.',
    '॥': '..',
    'ऽ': '\'',

    // English characters (pass through)
    ' ': ' ',
    '\n': '\n',
    '\t': '\t',
};

/**
 * Converts Unicode Nepali text to Preeti font
 * @param unicodeText - Nepali text in Unicode format
 * @returns Converted text in Preeti font format
 */
export function unicodeToPreeti(unicodeText: string): string {
    if (!unicodeText) return '';

    let preetiText = '';
    let i = 0;

    while (i < unicodeText.length) {
        let matched = false;

        // Try to match multi-character sequences first (e.g., क्ष, त्र, ज्ञ)
        for (let len = 3; len >= 1; len--) {
            const substr = unicodeText.substring(i, i + len);
            if (unicodeToPreetiMap[substr]) {
                preetiText += unicodeToPreetiMap[substr];
                i += len;
                matched = true;
                break;
            }
        }

        // If no match found, keep the character as is (for English, punctuation, etc.)
        if (!matched) {
            preetiText += unicodeText[i];
            i++;
        }
    }

    return preetiText;
}

/**
 * Preeti to Unicode converter (reverse conversion)
 * Note: This is more complex and may require additional logic
 * @param preetiText - Text in Preeti font format
 * @returns Converted text in Unicode format
 */
export function preetiToUnicode(preetiText: string): string {
    // Create reverse mapping
    const preetiToUnicodeMap: Record<string, string> = {};
    Object.entries(unicodeToPreetiMap).forEach(([unicode, preeti]) => {
        preetiToUnicodeMap[preeti] = unicode;
    });

    let unicodeText = '';
    let i = 0;

    while (i < preetiText.length) {
        let matched = false;

        // Try to match multi-character sequences first
        for (let len = 3; len >= 1; len--) {
            const substr = preetiText.substring(i, i + len);
            if (preetiToUnicodeMap[substr]) {
                unicodeText += preetiToUnicodeMap[substr];
                i += len;
                matched = true;
                break;
            }
        }

        // If no match found, keep the character as is
        if (!matched) {
            unicodeText += preetiText[i];
            i++;
        }
    }

    return unicodeText;
}
