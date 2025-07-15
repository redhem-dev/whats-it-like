/**
 * OCR Service for ID Card Processing
 * Uses Google Cloud Vision API to extract text from ID cards
 */
const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

// Creates a client using the credentials specified in GOOGLE_APPLICATION_CREDENTIALS env var
const client = new vision.ImageAnnotatorClient();

/**
 * Process ID card image to extract text information
 * @param {string} filePath - Path to the uploaded image file
 * @returns {Object} Extracted data including name and ID number
 */
async function processIdCard(filePath) {
  try {
    console.log(`Processing ID card image at path: ${filePath}`);
    
    // Performs text detection on the image file
    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in image');
    }
    
    console.log('Text detected in image');
    
    // First element contains all text
    const fullText = detections[0].description;
    console.log('Full text extracted:', fullText);
    
    // Parse the extracted text to get structured data
    const extractedData = parseIdCardData(fullText);
    console.log('Parsed data:', extractedData);
    
    return extractedData;
  } catch (error) {
    console.error('Error processing ID card:', error);
    throw error;
  }
}

/**
 * Validates if a string can be a valid ID number
 * Ensures it contains at least one letter AND one number
 * @param {string} str - String to validate as potential ID number
 * @returns {boolean} True if valid, false otherwise 
 */
function isValidIdNumber(str) {
  if (!str || typeof str !== 'string') return false;
  
  // Must contain at least one letter
  const hasLetter = /[a-zA-Z]/.test(str);
  
  // Must contain at least one number
  const hasNumber = /[0-9]/.test(str);
  
  // Must have both letters and numbers
  return hasLetter && hasNumber;
}

/**
 * Parse raw text from ID card into structured data
 * @param {string} text - Raw text extracted from the ID card
 * @param {Object} options - Optional configuration to target specific fields
 * @returns {Object} Structured data including name and ID number
 */
function parseIdCardData(text, options = {}) {
  // Default options with enhanced support for Bosnian IDs
  const config = {
    extractName: true,
    extractIdNumber: true,
    extractDateOfBirth: true,
    extractAddress: false,  // Default false as it may contain sensitive information
    nameKeywords: ['name:', 'full name:', 'ime:', 'ime/name:', 'prezime', 'surname', 'given name'],
    idNumberKeywords: ['id', 'number', 'identification', 'document no', 'no.', 'serijski broj', 'serial number', 'серијски број'],
    dateOfBirthKeywords: ['birth', 'date of birth', 'born', 'dob', 'datum rođenja', 'датум рођења'],
    bosnianIdPattern: /\d[A-Z]\d{3}[A-Z]\d{2}[A-Z]/,  // Format like 2A141A80K
    
    // Standard labels/placeholders on Bosnian IDs that should be filtered out
    bosnianStandardLabels: [
      // Latin script labels
      'BOSNA I HERCEGOVINA', 'LIČNA KARTA', 'OSOBNA ISKAZNICA', 'IDENTITY CARD',
      'PREZIME', 'IME', 'SPOL', 'DATUM ROĐENJA', 'DATE OF BIRTH', 'DRŽAVLJANSTVO',
      'CITIZENSHIP', 'POTPIS', 'SIGNATURE', 'VAŽI DO', 'VRIJEDI DO', 'VALID UNTIL',
      'SERIJSKI BROJ', 'SERIAL NUMBER', 'SURNAME', 'GIVEN NAME', 'SEX',
      // Cyrillic script labels
      'БОСНА И ХЕРЦЕГОВИНА', 'ЛИЧНА КАРТА', 'ПРЕЗИМЕ', 'ИМЕ', 'ПОЛ',
      'ДАТУМ РОЂЕЊА', 'ДРЖАВЉАНСТВО', 'ПОТПИС', 'ВАЖИ ДО', 'СЕРИЈСКИ БРОЈ'
    ],
    
    // Words that should not be in names
    excludeFromNames: [
      'bosna', 'hercegovina', 'bosna i hercegovina', 'identity', 'card', 'lična karta', 'osobna iskaznica',
      'prezime', 'ime', 'surname', 'given name', 'potpis', 'signature', 'citizenship', 'državljanstvo'
    ],
    ...options
  };
  
  // Determine document type from content
  const isBosnianId = text.toLowerCase().includes('bosna i hercegovina') || 
                     text.toLowerCase().includes('bosnia and herzegovina');

  // Convert text to lowercase for easier pattern matching
  const lowerText = text.toLowerCase();
  const lines = text.split('\n');
  
  // Result object
  const result = {
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
    address: '',
    rawText: text,
    confidence: 0.0
  };
  
  // Keep track of confidence levels for different fields
  const confidenceScores = [];
  
  // Look for common patterns in ID cards
  
  // Special handling for Bosnian IDs since their format is standardized
  if (isBosnianId) {
    console.log('Detected Bosnian ID card');
    
    // For Bosnian IDs, we need to extract first name and last name separately and combine them
    let firstName = '';
    let lastName = '';
    
    // First, filter out standard labels to avoid confusion
    const filteredLines = lines.filter(line => {
      // Skip lines that exactly match standard labels
      const exactLineMatch = config.bosnianStandardLabels.some(label => 
        line.trim() === label ||
        line.trim().startsWith(label + '/') ||
        line.trim().startsWith(label + ' /')
      );
      if (exactLineMatch) return false;
      
      return true;
    });
    
    // Extract first name - looking for lines after IME/GIVEN NAME
    let firstNameFound = false;
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Look specifically for name label indicators
      if ((lowerLine.includes('ime') && !lowerLine.includes('prezime')) || 
          lowerLine.includes('given name')) {
        
        // Look for actual name in the next 2 lines (sometimes there's a blank line)
        for (let j = 1; j <= 2; j++) {
          if (i + j < lines.length) {
            const nameLine = lines[i + j].trim();
            
            // Skip if this line is a standard label or empty
            if (!nameLine || config.bosnianStandardLabels.includes(nameLine)) {
              continue;
            }
            
            // Skip if this is a placeholder or header
            if (config.excludeFromNames.some(keyword => 
                nameLine.toLowerCase().includes(keyword))) {
              continue;
            }
            
            // Found a potential name - extract just the name part (before any slashes for Cyrillic)
            if (nameLine.includes('/')) {
              firstName = nameLine.split('/')[0].trim();
            } else {
              firstName = nameLine;
            }
            
            // In some formats there might be "EDHEM / ЕДХЕМ"
            // Remove any part that looks like a header
            if (firstName.includes('IME') || firstName.includes('GIVEN')) {
              firstName = '';
              continue;
            }
            
            if (firstName) {
              firstNameFound = true;
              console.log('Extracted first name:', firstName);
              confidenceScores.push(0.9);
              break;
            }
          }
        }
        
        if (firstNameFound) break;
      }
    }
    
    // Extract last name - looking for lines after PREZIME/SURNAME
    let lastNameFound = false;
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('prezime') || lowerLine.includes('surname')) {
        // Look for actual name in the next 2 lines
        for (let j = 1; j <= 2; j++) {
          if (i + j < lines.length) {
            const nameLine = lines[i + j].trim();
            
            // Skip if this line is a standard label or empty
            if (!nameLine || config.bosnianStandardLabels.includes(nameLine)) {
              continue;
            }
            
            // Skip if this is a placeholder or header
            if (config.excludeFromNames.some(keyword => 
                nameLine.toLowerCase().includes(keyword))) {
              continue;
            }
            
            // Found a potential name
            if (nameLine.includes('/')) {
              lastName = nameLine.split('/')[0].trim();
            } else {
              lastName = nameLine;
            }
            
            // Remove any part that looks like a header
            if (lastName.includes('PREZIME') || lastName.includes('SURNAME')) {
              lastName = '';
              continue;
            }
            
            if (lastName) {
              lastNameFound = true;
              console.log('Extracted last name:', lastName);
              confidenceScores.push(0.9);
              break;
            }
          }
        }
        
        if (lastNameFound) break;
      }
    }
    
    // If we couldn't find using the primary method, try the signature field
    if (!firstName || !lastName) {
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('potpis') || lowerLine.includes('signature')) {
          const lineIndex = lines.indexOf(line);
          if (lineIndex >= 0 && lineIndex + 1 < lines.length) {
            const signature = lines[lineIndex + 1].trim();
            // Usually signature has format "LastName FirstName"
            const parts = signature.split(' ');
            if (parts.length >= 2) {
              if (!lastName) lastName = parts[0];
              if (!firstName) firstName = parts.slice(1).join(' ');
              confidenceScores.push(0.8);
            }
            break;
          }
        }
      }
    }
    
    // Combine first and last name
    if (firstName && lastName) {
      result.fullName = `${firstName} ${lastName}`;
    } else if (firstName) {
      result.fullName = firstName;
    } else if (lastName) {
      result.fullName = lastName;
    }
    
    // Store individual components for matching
    result.firstName = firstName;
    result.lastName = lastName;
  } 
  // Standard name extraction for non-Bosnian IDs
  else if (config.extractName) {
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Look for name field with label using configurable keywords
      const hasNameKeyword = config.nameKeywords.some(keyword => lowerLine.includes(keyword));
      
      if (hasNameKeyword) {
        // Try to extract name after the colon
        const nameParts = line.split(':');
        if (nameParts.length > 1) {
          result.fullName = nameParts[1].trim();
          confidenceScores.push(0.9); // High confidence for labeled name
        } else {
          // If no colon, take the whole line except keywords
          const nameWithoutKeyword = line.replace(/name|full name|ime/gi, '').trim();
          if (nameWithoutKeyword) {
            result.fullName = nameWithoutKeyword;
            confidenceScores.push(0.7); // Medium confidence
          }
        }
        
        // If we found a name with high confidence, break the loop
        if (result.fullName && confidenceScores[confidenceScores.length - 1] > 0.8) {
          break;
        }
      }
    }
    
  // If no name found with keywords, try to extract based on common name patterns
  if (!result.fullName) {
      // Look for lines that look like names (2-3 words, no numbers or special chars)
      for (const line of lines) {
        const words = line.trim().split(/\s+/);
        const isLikelyName = words.length >= 2 && words.length <= 4 && 
                           !/[0-9@#$%^&*()+=\[\]{}|<>\/]/.test(line) &&
                           !line.toLowerCase().includes('id');
        
        if (isLikelyName) {
          result.fullName = line.trim();
          confidenceScores.push(0.5); // Lower confidence for pattern-based extraction
          break;
        }
      }
    }
  }
  
  // ID number extraction with special handling for Bosnian IDs
  if (config.extractIdNumber) {
    // Specialized extraction for Bosnian IDs
    if (isBosnianId) {
      console.log('Extracting Bosnian ID number...');
      
      // Define additional patterns for Bosnian ID numbers
      // Format examples: 2A141A80K, 2A141A-80K, 2A 141A 80K, etc.
      const bosnianIdPatterns = [
        // Standard format with no spaces or separators
        /\d[A-Z]\d{3}[A-Z]\d{2}[A-Z]/,
        // Format with spaces
        /\d\s?[A-Z]\s?\d{1,3}\s?[A-Z]\s?\d{1,2}\s?[A-Z]/,
        // Format with dashes
        /\d-?[A-Z]-?\d{1,3}-?[A-Z]-?\d{1,2}-?[A-Z]/,
        // More general fallback pattern
        /[0-9][A-Z][0-9]{1,3}[A-Z][0-9]{1,2}[A-Z]/
      ];
      
      // STEP 1: First look for ID exactly after SERIJSKI BROJ / SERIAL NUMBER labels
      let idFound = false;
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();
        
        // Check if this is the ID number label
        if (lowerLine.includes('serijski broj') || 
            lowerLine.includes('serial number') || 
            lowerLine.includes('серијски број')) {
          
          console.log('Found ID label line:', line);
          
          // Check the next 2 lines for the ID (sometimes there's blank space or formatting)
          for (let j = 1; j <= 2; j++) {
            if (i + j < lines.length) {
              const potentialIdLine = lines[i + j].trim();
              console.log(`  Checking potential ID line ${j}:`, potentialIdLine);
              
              // Skip if this line contains other standard labels
              if (config.bosnianStandardLabels.some(label => 
                  potentialIdLine.includes(label))) {
                console.log('  Skipping line - contains standard label');
                continue;
              }
              
              // Try each pattern to find an ID match
              let idMatch = null;
              for (const pattern of bosnianIdPatterns) {
                const matches = potentialIdLine.match(pattern);
                if (matches && matches[0]) {
                  idMatch = matches[0].trim();
                  console.log('  Found ID number by pattern match:', idMatch);
                  break;
                }
              }
              
              // If we found a pattern match, use it and validate
              if (idMatch) {
                const cleanId = idMatch.replace(/\s+|-/g, ''); // Clean spaces/dashes
                if (isValidIdNumber(cleanId)) {
                  result.idNumber = cleanId;
                  confidenceScores.push(0.98); // Highest confidence - labeled + pattern
                  idFound = true;
                  console.log('  Valid ID number found:', cleanId);
                  break;
                } else {
                  console.log('  Invalid ID format (needs letters AND numbers):', cleanId);
                }
              }
              
              // If no pattern match, but line is alphanumeric, not too long, and has valid ID format
              if (/[A-Z0-9]/.test(potentialIdLine) && 
                  potentialIdLine.length <= 15 &&
                  !/prezime|ime|surname|given name|signature|potpis|bosna|hercegovina/i.test(potentialIdLine)) {
                
                const cleanId = potentialIdLine.replace(/\s+|-/g, '');
                
                // Check if it's a valid ID (contains both letters AND numbers)
                if (isValidIdNumber(cleanId)) {
                  result.idNumber = cleanId;
                  console.log('  Using entire line as valid ID:', result.idNumber);
                  confidenceScores.push(0.8); // Good confidence - right after label
                  idFound = true;
                  break;
                } else {
                  console.log('  Rejecting invalid ID format:', cleanId, '(needs both letters AND numbers)');
                }
              }
            }
          }
          
          if (idFound) break;
        }
      }
      
      // STEP 2: If not found with labels, scan all lines for the specific patterns
      if (!idFound || !result.idNumber) {
        console.log('Looking for ID pattern in all lines...');
        for (const line of lines) {
          // Skip lines that contain standard labels
          if (config.bosnianStandardLabels.some(label => 
              line.includes(label))) {
            continue;
          }
          
          // Try each pattern
          for (const pattern of bosnianIdPatterns) {
            const matches = line.match(pattern);
            if (matches && matches[0]) {
              const cleanId = matches[0].replace(/\s+|-/g, ''); // Clean spaces/dashes
              
              // Validate ID format (must have both letters and numbers)
              if (isValidIdNumber(cleanId)) {
                result.idNumber = cleanId;
                console.log('Found valid ID number by pattern in line:', result.idNumber);
                confidenceScores.push(0.9);
                idFound = true;
                break;
              } else {
                console.log('Rejecting invalid ID format (needs both letters AND numbers):', cleanId);
              }
            }
          }
          
          if (idFound) break;
        }
      }
    } 
    // Standard extraction for non-Bosnian IDs
    else {
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Look for ID number with labels using configurable keywords
        const hasIdKeyword = config.idNumberKeywords.some(keyword => lowerLine.includes(keyword));
        
        if (hasIdKeyword) {
          // Try to extract numeric sequence that could be an ID
          const matches = line.match(/[A-Z0-9]{6,}/);
          if (matches && matches[0]) {
            result.idNumber = matches[0].trim();
            confidenceScores.push(0.9); // High confidence for pattern match
          } else {
            // If no direct match, try to extract what comes after the colon
            const idParts = line.split(':');
            if (idParts.length > 1) {
              result.idNumber = idParts[1].trim();
              confidenceScores.push(0.8); // Good confidence for labeled extraction
            }
          }
          
          // If we found an ID with high confidence, break the loop
          if (result.idNumber && confidenceScores[confidenceScores.length - 1] > 0.8) {
            break;
          }
        }
      }
    }
  }
  
  // Date of birth extraction
  if (config.extractDateOfBirth) {
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Look for date of birth keywords
      const hasDobKeyword = config.dateOfBirthKeywords.some(keyword => lowerLine.includes(keyword));
      
      if (hasDobKeyword) {
        // Try to extract date patterns
        const dateMatch = line.match(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/) || // Format: DD/MM/YYYY or similar
                          line.match(/\d{1,2}\s+[a-zA-Z]+\s+\d{2,4}/); // Format: DD Month YYYY
        
        if (dateMatch && dateMatch[0]) {
          result.dateOfBirth = dateMatch[0].trim();
          confidenceScores.push(0.9); // High confidence for pattern match
          break;
        } else {
          // Try to extract what comes after the label
          const parts = line.split(':');
          if (parts.length > 1) {
            result.dateOfBirth = parts[1].trim();
            confidenceScores.push(0.7); // Medium confidence
          }
        }
      }
    }
  }
  
  // If name wasn't found using configuration methods, try fallback patterns
  if (!result.fullName) {
    for (const line of lines) {
      // Names usually have capital letters in a specific pattern
      if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line)) {
        result.fullName = line.trim();
        confidenceScores.push(0.5); // Lower confidence for pattern-based extraction
        break;
      }
    }
  }
  
  // If ID number wasn't found through configured methods, try fallback pattern
  if (!result.idNumber) {
    for (const line of lines) {
      // IDs often have specific patterns (adjust based on your country's ID format)
      const matches = line.match(/[A-Z0-9]{6,}/);
      if (matches && matches[0]) {
        const potentialId = matches[0].trim();
        
        // Validate the ID format (must have at least one letter AND one number)
        if (isValidIdNumber(potentialId)) {
          result.idNumber = potentialId;
          console.log('Found valid ID in fallback search:', potentialId);
          confidenceScores.push(0.4); // Lower confidence for general pattern match
          break;
        } else {
          console.log('Rejecting invalid ID in fallback search:', potentialId);
        }
      }
    }
  }
  
  // Calculate overall confidence based on individual field confidences
  if (confidenceScores.length > 0) {
    result.confidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  }
  
  return result;
}

/**
 * Verify if user input matches OCR extracted data
 * Enhanced verification system for user registration that strictly validates
 * name and ID match between user input and OCR extracted data
 * 
 * @param {Object} userData - User-provided registration data (firstName, lastName, idNumber)
 * @param {Object} ocrData - Data extracted from ID card using OCR
 * @returns {Object} - Verification result with success flag and detailed message
 */
function verifyUserInputMatchesOcr(userData, ocrData) {
  // Default result with success
  const result = {
    success: true,
    message: 'Verification successful',
    mismatches: [],
  };
  
  // Name verification
  let nameMatches = false;
  
  // Create full name from provided first and last name
  const providedFullName = `${userData.firstName} ${userData.lastName}`.toLowerCase().trim();
  
  // First try exact match with separated first/last name fields (for Bosnian IDs)
  if (ocrData.firstName && ocrData.lastName) {
    const ocrFullName = `${ocrData.firstName} ${ocrData.lastName}`.toLowerCase().trim();
    
    // Check if names match exactly or are contained within each other
    if (providedFullName === ocrFullName || 
        providedFullName.includes(ocrFullName) || 
        ocrFullName.includes(providedFullName)) {
      nameMatches = true;
    } else {
      // Check individual first/last name fields
      const firstNameMatch = userData.firstName.toLowerCase().includes(ocrData.firstName.toLowerCase()) ||
                           ocrData.firstName.toLowerCase().includes(userData.firstName.toLowerCase());
                           
      const lastNameMatch = userData.lastName.toLowerCase().includes(ocrData.lastName.toLowerCase()) ||
                          ocrData.lastName.toLowerCase().includes(userData.lastName.toLowerCase());
                          
      if (!firstNameMatch) result.mismatches.push('firstName');
      if (!lastNameMatch) result.mismatches.push('lastName');
      
      // If either first or last name matches, consider it partially successful
      nameMatches = firstNameMatch || lastNameMatch;
    }
  }
  // Fall back to checking full name against OCR fullName
  else if (ocrData.fullName) {
    const extractedNameLower = ocrData.fullName.toLowerCase().trim();
    
    // Check if names contain each other (more flexible match)
    if (extractedNameLower.includes(providedFullName) || 
        providedFullName.includes(extractedNameLower)) {
      nameMatches = true;
    } else {
      result.mismatches.push('name');
    }
  }
  
  // ID number verification - must match exactly (case-insensitive)
  let idMatches = false;
  if (ocrData.idNumber && userData.idNumber) {
    // Clean IDs (remove spaces and special chars) for comparison
    const cleanExtractedId = ocrData.idNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanProvidedId = userData.idNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    if (cleanExtractedId === cleanProvidedId) {
      idMatches = true;
    } else {
      result.mismatches.push('idNumber');
    }
  }
  
  // Update success flag based on name and ID match
  // We require BOTH name and ID to match for successful verification
  result.success = nameMatches && idMatches;
  
  // If verification failed, customize error message
  if (!result.success) {
    if (!nameMatches && !idMatches) {
      result.message = 'Both name and ID number don\'t match the uploaded ID card';
    } else if (!idMatches) {
      result.message = 'ID number doesn\'t match the uploaded ID card';
    } else {
      result.message = 'Name doesn\'t match the uploaded ID card';
    }
  }
  
  return result;
}

module.exports = {
  processIdCard,
  parseIdCardData,
  verifyUserInputMatchesOcr
};
