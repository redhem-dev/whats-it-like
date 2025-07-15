/**
 * Utility for converting between Latin and Cyrillic scripts
 * Used for Serbian ID cards which can display text in either script
 */

// Latin to Cyrillic mapping for Serbian language
const latinToCyrillicMap = {
  'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'đ': 'ђ', 'e': 'е', 'ž': 'ж',
  'z': 'з', 'i': 'и', 'j': 'ј', 'k': 'к', 'l': 'л', 'lj': 'љ', 'm': 'м', 'n': 'н',
  'nj': 'њ', 'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 'š': 'ш', 't': 'т', 'ć': 'ћ',
  'u': 'у', 'f': 'ф', 'h': 'х', 'c': 'ц', 'č': 'ч', 'dž': 'џ',
  'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д', 'Đ': 'Ђ', 'E': 'Е', 'Ž': 'Ж',
  'Z': 'З', 'I': 'И', 'J': 'Ј', 'K': 'К', 'L': 'Л', 'Lj': 'Љ', 'M': 'М', 'N': 'Н',
  'Nj': 'Њ', 'O': 'О', 'P': 'П', 'R': 'Р', 'S': 'С', 'Š': 'Ш', 'T': 'Т', 'Ć': 'Ћ',
  'U': 'У', 'F': 'Ф', 'H': 'Х', 'C': 'Ц', 'Č': 'Ч', 'Dž': 'Џ'
};

// Cyrillic to Latin mapping for Serbian language
const cyrillicToLatinMap = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'đ', 'е': 'e', 'ж': 'ž',
  'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n',
  'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'ш': 'š', 'т': 't', 'ћ': 'ć',
  'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'č', 'џ': 'dž',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Đ', 'Е': 'E', 'Ж': 'Ž',
  'З': 'Z', 'И': 'I', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj', 'М': 'M', 'Н': 'N',
  'Њ': 'Nj', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Ш': 'Š', 'Т': 'T', 'Ћ': 'Ć',
  'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Č', 'Џ': 'Dž'
};

/**
 * Convert text from Latin to Cyrillic script
 * @param {string} text - Text in Latin script
 * @returns {string} - Text in Cyrillic script
 */
function latinToCyrillic(text) {
  if (!text) return '';
  
  // Handle digraphs (lj, nj, dž) first
  let result = text
    .replace(/Lj/g, 'Љ')
    .replace(/lj/g, 'љ')
    .replace(/Nj/g, 'Њ')
    .replace(/nj/g, 'њ')
    .replace(/Dž/g, 'Џ')
    .replace(/dž/g, 'џ');
  
  // Then handle single characters
  result = result.split('').map(char => latinToCyrillicMap[char] || char).join('');
  
  return result;
}

/**
 * Convert text from Cyrillic to Latin script
 * @param {string} text - Text in Cyrillic script
 * @returns {string} - Text in Latin script
 */
function cyrillicToLatin(text) {
  if (!text) return '';
  
  // Handle each character
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += cyrillicToLatinMap[char] || char;
  }
  
  return result;
}

/**
 * Normalize text for comparison, converting both scripts to Latin
 * and standardizing case and spacing
 * @param {string} text - Text in either Latin or Cyrillic script
 * @returns {string} - Normalized text in Latin script
 */
function normalizeForComparison(text) {
  if (!text) return '';
  
  // Convert to lowercase
  let normalized = text.toLowerCase();
  
  // Convert any Cyrillic characters to Latin
  normalized = cyrillicToLatin(normalized);
  
  // Remove diacritics (make đ->d, ć->c, š->s, etc)
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
    
  // Remove non-alphanumeric characters and standardize whitespace
  normalized = normalized
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * Check if two strings match, accounting for script differences
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {boolean} - True if the strings match after normalization
 */
function stringsMatch(str1, str2) {
  if (!str1 && !str2) return true;
  if (!str1 || !str2) return false;
  
  return normalizeForComparison(str1) === normalizeForComparison(str2);
}

module.exports = {
  latinToCyrillic,
  cyrillicToLatin,
  normalizeForComparison,
  stringsMatch
};
