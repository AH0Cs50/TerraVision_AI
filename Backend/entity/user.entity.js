/**
 * User entity. Wraps raw user data in a private #data field.
 * All mutations flow through methods that return deltas or mutate #data directly.
 */
class User {
  #data;

  /**
   * @param {object} data - Raw user record from the DB
   */
  constructor(data) {
    this.#data = { ...data };
  }

  /**
   * The user's public UUID
   * @returns {string}
   */
  get uuid() {
    return this.#data.uuid;
  }
  /**
   * The user's internal numeric ID (FK target)
   * @returns {number}
   */
  get internalId() {
    return this.#data.internalId;
  }
  /**
   * The user's display name
   * @returns {string}
   */
  get name() {
    return this.#data.name;
  }
  /**
   * The user's email address
   * @returns {string}
   */
  get email() {
    return this.#data.email;
  }
  /**
   * The user's role ("user" | "admin")
   * @returns {string}
   */
  get role() {
    return this.#data.role;
  }
  /**
   * Whether the user's email has been verified
   * @returns {boolean}
   */
  get isVerified() {
    return this.#data.isverified;
  }
  /**
   * The user's location object (city or lat/lon)
   * @returns {object}
   */
  get location() {
    return this.#data.location;
  }
  /**
   * The date the user was created
   * @returns {Date}
   */
  get createdAt() {
    return this.#data.createdAt;
  }

  /**
   * Returns the bcrypt-hashed password
   * @returns {string}
   */
  getPassword() {
    return this.#data.password;
  }
  /**
   * Returns the hashed refresh token
   * @returns {string|null}
   */
  getRefreshToken() {
    return this.#data.refreshToken;
  }

  /**
   * Replaces the stored password hash
   * @param {string} newHashed - The new bcrypt hash
   */
  changePassword(newHashed) {
    this.#data.password = newHashed;
  }
  /**
   * Stores a new hashed refresh token
   * @param {string} token - The hashed refresh token
   */
  setRefreshToken(token) {
    this.#data.refreshToken = token;
  }
  /**
   * Clears the stored refresh token (sets to null)
   */
  clearRefreshToken() {
    this.#data.refreshToken = null;
  }

  /**
   * Returns a shallow copy of all internal data
   * @returns {object}
   */
  toJSON() {
    return { ...this.#data };
  }

  /**
   * Returns a safe subset of user data suitable for API responses (excludes password and refreshToken)
   * @returns {{ uuid: string, name: string, email: string, role: string, isverified: boolean, location: object, createdAt: Date }}
   */
  toSafeObject() {
    const { uuid, name, email, role, isverified, location, createdAt } =
      this.#data;
    return { uuid, name, email, role, isverified, location, createdAt };
  }
}

export default User;
