import bcrypt from "bcrypt";

class PasswordHasher {
  constructor() {
    this.saltRounds = 12; // good balance between security and performance
  }

  // ==========================
  // Hash password
  // ==========================
  async hash(password) {
    if (!password) {
      throw new Error("Password is required");
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);
    return hashedPassword;
  }

  // ==========================
  // Compare password
  // ==========================
  async compare(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) {
      throw new Error("Password and hash are required");
    }

    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export default PasswordHasher;