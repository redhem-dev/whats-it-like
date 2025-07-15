/**
 * Bosnian ID Card Recognition Service
 * 
 * Specialized extraction logic for Bosnian ID cards only
 */
const ocrService = require('./ocrService');
const path = require('path');
const fs = require('fs');

/**
 * Text patterns that should be excluded from name extraction
 */
const EXCLUDE_FROM_NAMES = [
  'IDENTITY', 'CARD', 'ID', 'LIČNA', 'KARTA',
  'REPUBLIC', 'REPUBLIKA', 'LICENCE', 'DRIVER', 'DATE', 'BIRTH',
  'DATUM', 'ROĐENJA', 'ROĐEN', 'MJESTO', 'PLACE', 'SPOL', 'SEX', 'POL',
  'EXPIRY', 'VRIJEDI', 'VAŽI', 'NUMBER', 'BROJ', 'SIGNATURE', 'POTPIS', 'Prezime', 'Prezime/Surname',
];

/**
 * Bosnian ID card patterns and keywords
 */
const BOSNIAN_ID_PATTERNS = {
  countryNames: [
    'BOSNA I HERCEGOVINA', 'БОСНА И ХЕРЦЕГОВИНА', 'BOSNIA AND HERZEGOVINA', 
    'БОСНА', 'BOSNA', 'HERZEGOVINA', 'HERCEGOVINA'
  ],
  idLabels: [
    'SERIJSKI BROJ', 'СЕРИЈСКИ БРОЈ', 'SERIAL NUMBER',
    'BROJ DOKUMENTA', 'БРОЈ ДОКУМЕНТА', 'DOCUMENT NUMBER'
  ],
  idPattern: /^[0-9A-Z]{7,12}$/,
  nameLabels: {
    firstName: ['IME', 'ИМЕ', 'GIVEN NAME'],
    lastName: ['PREZIME', 'ПРЕЗИМЕ', 'SURNAME']
  },
  bannedWords: [
    'IDENTITY', 'CARD', 'NUMBER',
    'BROJ', 'IME', 'NAME', 'SURNAME', 'PREZIME'
  ] 
};

/**
 * Process a Bosnian ID card image
 * @param {string} filePath - Path to the uploaded image file
 * @returns {Object} Extracted and enhanced data
 */
function processBosnianId(filePath) {
  if (!fs.existsSync(filePath)) {
    return { error: 'File not found' };
  }
  
  // Extract text from image using OCR
  const extractedText = ocrService.extractTextFromImage(filePath);
  
  if (!extractedText) {
    return { error: 'Failed to extract text from image' };
  }
  
  // Extract data from the OCR text
  const extractedData = extractIdCardData(extractedText);
  
  // Add original image path for reference
  extractedData.imagePath = path.basename(filePath);
  
  return extractedData;
}

/**
 * Extract ID card data from OCR text
 * @param {string} text - Raw OCR text from ID card
 * @returns {Object} Extracted data (idNumber, firstName, lastName, fullName)
 */
function extractIdCardData(text) {
  if (!text) {
    return {
      country: 'BA',
      idNumber: null,
      firstName: null,
      lastName: null,
      fullName: null
    };
  }
  
  // Extract the ID number and name
  const idNumber = extractIdNumber(text);
  const nameData = extractName(text);
  
  return {
    country: 'BA',
    idNumber,
    ...nameData
  };
}

/**
 * Extract ID number from OCR text
 * @param {string} text - Raw OCR text
 * @returns {string|null} Extracted ID number or null if not found
 */
function extractIdNumber(text) {
  if (!text) return null;
  
  const bannedWords = BOSNIAN_ID_PATTERNS.bannedWords;
  
  // Filter function that validates ID format
  const isValidId = (id) => {
    if (!id) return false;
    
    // Validate Bosnian alphanumeric format
    if (!BOSNIAN_ID_PATTERNS.idPattern.test(id)) {
      return false;
    }
    
    // Ensure ID doesn't contain banned words
    const idLower = id.toLowerCase();
    for (const word of bannedWords) {
      if (idLower.includes(word.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  };
  
  // Get lines from text
  const lines = text.split('\n').map(l => l.trim());
  const candidateIds = [];
  
  // STEP 1: Look for lines containing ID labels
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();
    if (BOSNIAN_ID_PATTERNS.idLabels.some(label => line.includes(label))) {
      // Check if ID is on the same line after the label
      for (const label of BOSNIAN_ID_PATTERNS.idLabels) {
        if (line.includes(label)) {
          const afterLabel = line.substring(line.indexOf(label) + label.length).trim();
          // Use regex to extract alphanumeric sequence
          const match = afterLabel.match(/[A-Z0-9]{7,12}/i);
          if (match && BOSNIAN_ID_PATTERNS.idPattern.test(match[0])) {
            candidateIds.push({ id: match[0], priority: 1, ratio: 1.0 });
          }
        }
      }
      
      // If not found on same line, check next line
      if (candidateIds.length === 0 && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const match = nextLine.match(/[A-Z0-9]{7,12}/i);
        if (match && BOSNIAN_ID_PATTERNS.idPattern.test(match[0])) {
          candidateIds.push({ id: match[0], priority: 1, ratio: 1.0 });
        }
      }
    }
  }
  
  // STEP 2: If still not found, scan all lines for valid Bosnian ID pattern
  if (candidateIds.length === 0) {
    for (const line of lines) {
      // Skip lines with banned words
      const lowerLine = line.toLowerCase();
      if (bannedWords.some(word => lowerLine.includes(word.toLowerCase()))) {
        continue;
      }
      
      // Look for alphanumeric pattern matching Bosnian ID
      const match = line.match(/[A-Z0-9]{7,12}/i);
      if (match && BOSNIAN_ID_PATTERNS.idPattern.test(match[0])) {
        candidateIds.push({ id: match[0], priority: 2, ratio: 0.9 });
      }
    }
  }
  
  // STEP 3: Sort candidates by priority (lower is better)
  candidateIds.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (b.ratio || 0) - (a.ratio || 0);
  });
  
  // STEP 4: Return the best candidate if it's valid
  if (candidateIds.length > 0) {
    const selectedId = candidateIds[0].id;
    if (isValidId(selectedId)) {
      return selectedId;
    }
  }
  
  return null;
}

/**
 * Extract name from OCR text
 * @param {string} text - Raw OCR text
 * @returns {Object} Object with firstName, lastName, and fullName properties
 */
function extractName(text) {
  if (!text) return { firstName: null, lastName: null, fullName: null };
  
  let firstName = null;
  let lastName = null;
  
  // Get lines from text
  const lines = text.split('\n').map(l => l.trim());
  
  // STEP 1: Look for name labels
  const firstNameLabels = BOSNIAN_ID_PATTERNS.nameLabels.firstName;
  const lastNameLabels = BOSNIAN_ID_PATTERNS.nameLabels.lastName;
  
  // Process each line for first name
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip excluded text
    if (isExcludedText(line)) continue;
    
    // Check for first name labels
    for (const label of firstNameLabels) {
      if (line.toUpperCase().includes(label)) {
        // Extract name after the label
        let nameValue = line.substring(line.toUpperCase().indexOf(label) + label.length).trim();
        
        // If empty, check next line
        if (!nameValue && i + 1 < lines.length) {
          nameValue = lines[i + 1].trim();
        }
        
        // Clean up name
        if (nameValue && !isExcludedText(nameValue)) {
          firstName = cleanName(nameValue);
          break;
        }
      }
    }
    
    // Check for last name labels
    for (const label of lastNameLabels) {
      if (line.toUpperCase().includes(label)) {
        // Extract name after the label
        let nameValue = line.substring(line.toUpperCase().indexOf(label) + label.length).trim();
        
        // If empty, check next line
        if (!nameValue && i + 1 < lines.length) {
          nameValue = lines[i + 1].trim();
        }
        
        // Clean up name
        if (nameValue && !isExcludedText(nameValue)) {
          lastName = cleanName(nameValue);
          break;
        }
      }
    }
  }
  
  // STEP 2: If we found both names, construct full name
  let fullName = null;
  if (firstName && lastName) {
    fullName = `${firstName} ${lastName}`;
  }
  
  return { firstName, lastName, fullName };
}

/**
 * Clean up a name string
 * @param {string} name - Raw name string
 * @returns {string} Cleaned name
 */
function cleanName(name) {
  if (!name) return null;
  
  // Remove excess spaces, common labels, and special chars
  let cleaned = name.replace(/[0-9]/g, '') // Remove digits
                    .replace(/\//g, '')    // Remove forward slashes
                    .replace(/\s+/g, ' ')   // Normalize spaces
                    .trim();
  
  // Convert first character of each word to uppercase, rest to lowercase
  cleaned = cleaned.split(' ')
                   .filter(word => word.length > 0)
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                   .join(' ');
  
  return cleaned || null;
}

/**
 * Check if text is a standard label that should be excluded
 * @param {string} text - Text to check
 * @returns {boolean} True if text should be excluded
 */
function isExcludedText(text) {
  if (!text) return true;
  
  const lowerText = text.toLowerCase();
  return EXCLUDE_FROM_NAMES.some(excluded => 
    lowerText.includes(excluded.toLowerCase())
  );
}

/**
 * Process an ID card image with country-specific recognition
 * Legacy function for compatibility - forwards to processBosnianId
 * 
 * @param {string} filePath - Path to the uploaded image file
 * @param {string} country - Country code (only 'BA' supported)
 * @returns {Object} Extracted and enhanced data
 */
function processCountrySpecificId(filePath, country = 'BA') {
  // We only support BA now
  return processBosnianId(filePath);
}

/**
 * Verify user data against OCR extracted data
 * @param {Object} userData - User provided data
 * @param {Object} ocrData - OCR extracted data
 * @returns {Object} Verification result with match status
 */
function verifyUserData(userData, ocrData) {
  if (!userData || !ocrData) {
    return { match: false, reason: 'Missing data' };
  }
  
  // Normalize ID numbers for comparison (remove spaces, dashes)
  const normalizeId = (id) => id ? id.replace(/[\s\-]/g, '') : '';
  
  const userIdNormalized = normalizeId(userData.idNumber);
  const ocrIdNormalized = normalizeId(ocrData.idNumber);
  
  // Check if ID numbers match
  const idMatch = userIdNormalized && ocrIdNormalized && 
                  userIdNormalized === ocrIdNormalized;
  
  // Optional name check - normalize and compare if available
  let nameMatch = true;
  if (userData.fullName && ocrData.fullName) {
    const normalizeName = (name) => name.toLowerCase().trim();
    const userNameNormalized = normalizeName(userData.fullName);
    const ocrNameNormalized = normalizeName(ocrData.fullName);
    nameMatch = userNameNormalized.includes(ocrNameNormalized) || 
                ocrNameNormalized.includes(userNameNormalized);
  }
  
  return {
    match: idMatch && nameMatch,
    idMatch: idMatch,
    nameMatch: nameMatch,
    reason: !idMatch ? 'ID number mismatch' : 
            !nameMatch ? 'Name mismatch' : null
  };
}

// For backward compatibility
const verifyCountrySpecificData = verifyUserData;

// Public API
module.exports = {
  processCountrySpecificId,
  processBosnianId,
  extractIdCardData,
  extractIdNumber,
  extractName,
  verifyUserData,
  verifyCountrySpecificData
};
