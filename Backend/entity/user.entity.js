class User {
  #data;

  constructor(data) {
    this.#data = { ...data };
  }

  get uuid() {
    return this.#data.uuid;
  }
  get internalId() {
    return this.#data.internalId;
  }
  get name() {
    return this.#data.name;
  }
  get email() {
    return this.#data.email;
  }
  get role() {
    return this.#data.role;
  }
  get isVerified() {
    return this.#data.isverified;
  }
  get location() {
    return this.#data.location;
  }
  get createdAt() {
    return this.#data.createdAt;
  }

  getPassword() {
    return this.#data.password;
  }
  getRefreshToken() {
    return this.#data.refreshToken;
  }

  changePassword(newHashed) {
    this.#data.password = newHashed;
  }
  setRefreshToken(token) {
    this.#data.refreshToken = token;
  }
  clearRefreshToken() {
    this.#data.refreshToken = null;
  }

  toJSON() {
    return { ...this.#data };
  }

  toSafeObject() {
    const { uuid, name, email, role, isverified, location, createdAt } =
      this.#data;
    return { uuid, name, email, role, isverified, location, createdAt };
  }
}

export default User;
