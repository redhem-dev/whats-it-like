/**
 * ID number hashing utility
 * Securely hashes ID numbers before storage to comply with EU GDPR regulations
 */
const crypto = require('crypto');

/**
 * Hash an ID number using SHA-256 with a salt
 * @param {string} idNumber - The raw ID number to hash
 * @returns {string} - The secure hash of the ID number
 */
const hashIdNumber = (idNumber) => {
  if (!idNumber) return null;
  
  // Use environment variable for salt, with fallback
  const salt = process.env.ID_HASH_SALT || 'whats-it-like-default-id-hash-salt';
  
  // Clean the ID number (remove spaces and special chars)
  const cleanIdNumber = idNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Create SHA-256 hash with salt
  return crypto
    .createHmac('sha256', salt)
    .update(cleanIdNumber)
    .digest('hex');
};

/**
 * Compare a raw ID number with a stored hash
 * @param {string} rawIdNumber - The raw ID number to verify
 * @param {string} storedHash - The stored hash to compare against
 * @returns {boolean} - True if the raw ID matches the hash
 */
const verifyIdHash = (rawIdNumber, storedHash) => {
  if (!rawIdNumber || !storedHash) return false;
  
  // Hash the raw ID number
  const calculatedHash = hashIdNumber(rawIdNumber);
  
  // Compare the calculated hash with the stored hash
  return calculatedHash === storedHash;
};

module.exports = {
  hashIdNumber,
  verifyIdHash
};
