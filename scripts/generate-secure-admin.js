#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Generate secure admin credentials for production deployment
 * 
 * Usage: node scripts/generate-secure-admin.js
 */

function generateSecurePassword(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password, salt) {
  // Using Node.js built-in scrypt for secure password hashing
  return new Promise((resolve, reject) => {
    // N=16384, r=8, p=1 are the recommended parameters for scrypt
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

async function generateAdminCredentials() {
  console.log('🔐 Generating Secure Admin Credentials...\n');
  
  const password = generateSecurePassword();
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('=== SAVE THESE CREDENTIALS SECURELY ===\n');
  console.log(`Admin Password: ${password}`);
  console.log('(Save this password in a secure password manager - you won\'t see it again!)\n');
  
  console.log('=== ADD TO YOUR .env.production FILE ===\n');
  console.log(`REACT_APP_ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`REACT_APP_ADMIN_SALT=${salt}`);
  console.log(`REACT_APP_JWT_SECRET=${jwtSecret}`);
  console.log('\n=== SECURITY NOTES ===');
  console.log('1. Never commit the .env.production file to version control');
  console.log('2. Use different credentials for each environment');
  console.log('3. Rotate these credentials regularly');
  console.log('4. Enable 2FA for admin accounts after deployment');
}

// Run the generator
generateAdminCredentials().catch(console.error);