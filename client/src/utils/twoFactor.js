const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorUtils {
  // Generate a new secret for a user
  static generateSecret(email) {
    return speakeasy.generateSecret({
      name: `Ziver (${email})`,
      issuer: 'Ziver'
    });
  }

  // Verify a TOTP token
  static verifyToken(secret, token, window = 1) {
    try {
      return speakeasy.totp.verify({
        secret: secret,
        token: token,
        window: window, // Allow 30-second clock drift
        encoding: 'base32'
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  // Generate QR code for authenticator app
  static async generateQRCode(otpauthUrl) {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes with dashes for readability
      const code = crypto.randomBytes(6).toString('hex').toUpperCase().match(/.{1,4}/g).join('-');
      codes.push(code);
    }
    return codes;
  }

  // Hash backup codes for storage
  static hashBackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  // Verify backup code
  static verifyBackupCode(hashedCodes, backupCode) {
    const hashedInput = this.hashBackupCode(backupCode);
    return hashedCodes.includes(hashedInput);
  }

  // Validate token format
  static isValidToken(token) {
    return /^\d{6}$/.test(token);
  }
}

module.exports = TwoFactorUtils;