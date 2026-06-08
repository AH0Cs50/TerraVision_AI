import bcrypt from "bcrypt";

/**
 * @description Wraps bcrypt to provide password hashing and comparison
 * with a configurable salt round count (default 12).
 */
class PasswordHasher {
  constructor() {
    this.saltRounds = 12; // good balance between security and performance
  }

  /**
   * @description Hashes a plaintext password using bcrypt.
   * @param {string} password - Plaintext password
   * @returns {Promise<string>} Hashed password
   * @throws {Error} If password is empty
   */
  async hash(password) {
    if (!password) {
      throw new Error("Password is required");
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    return hashedPassword;
  }

  /**
   * @description Compares a plaintext password against a bcrypt hash.
   * @param {string} plainPassword - Plaintext password
   * @param {string} hashedPassword - Bcrypt hash to compare against
   * @returns {Promise<boolean>} True if the password matches
   * @throws {Error} If either argument is missing
   */
  async compare(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      throw new Error("Password and hash are required");
    }

    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export default PasswordHasher;