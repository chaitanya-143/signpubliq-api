import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Generate a random password and encrypt it using bcrypt
 * @param {number} length - Length of the random password (default: 10)
 * @returns {Promise<{plain: string, hashed: string}>}
 */
export async function generateEncryptedPassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!';
    const plainPassword = Array.from(crypto.randomFillSync(new Uint32Array(length)))
        .map(x => chars[x % chars.length])
        .join('');

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    return { plain: plainPassword, hashed: hashedPassword };
}
