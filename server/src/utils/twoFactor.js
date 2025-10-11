const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorUtils {
  static generateSecret(email) {
    return speakeasy.generateSecret({
      name: `Ziver (${email})`,
      issuer: 'Ziver'
    });
  }

  static async generateQRCode(otpauthUrl) {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time-steps (1 minute) variance
    });
  }

  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  static generateBackupCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static hashBackupCode(code) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  static verifyBackupCode(hashedCodes, code) {
    const hashedCode = this.hashBackupCode(code);
    return hashedCodes.includes(hashedCode);
  }
}

module.exports = TwoFactorUtils;