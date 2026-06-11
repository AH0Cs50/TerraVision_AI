import assert from "assert";
import PasswordHasher from "../service/common/passHash.service.js";

const passHasher = new PasswordHasher();

async function runTests() {
  console.log("Running PasswordHasher Tests...\n");

  // T1: hash produces a string that starts with $2b$
  try {
    const hash = await passHasher.hash("MySecret123!");
    assert(typeof hash === "string", "Hash should be a string");
    assert(hash.startsWith("$2b$"), "Hash should start with $2b$ (bcrypt)");
    console.log("✅ T1 passed: hash produces valid bcrypt string");
  } catch (error) {
    console.error("❌ T1 failed:", error.message);
  }

  // T2: hash generates different values for same password (different salts)
  try {
    const hash1 = await passHasher.hash("SamePassword");
    const hash2 = await passHasher.hash("SamePassword");
    assert(hash1 !== hash2, "Two hashes of same password should differ");
    console.log("✅ T2 passed: hash generates unique salts");
  } catch (error) {
    console.error("❌ T2 failed:", error.message);
  }

  // T3: compare returns true for matching password
  try {
    const hash = await passHasher.hash("MatchMe123!");
    const match = await passHasher.compare("MatchMe123!", hash);
    assert(match === true, "compare should return true for matching password");
    console.log("✅ T3 passed: compare matches correct password");
  } catch (error) {
    console.error("❌ T3 failed:", error.message);
  }

  // T4: compare returns false for wrong password
  try {
    const hash = await passHasher.hash("RealPassword");
    const match = await passHasher.compare("WrongPassword", hash);
    assert(match === false, "compare should return false for wrong password");
    console.log("✅ T4 passed: compare rejects wrong password");
  } catch (error) {
    console.error("❌ T4 failed:", error.message);
  }

  // T5: hash rejects empty password
  try {
    await passHasher.hash("");
    console.log("❌ T5 failed: should throw for empty password");
  } catch (error) {
    assert(error.message.includes("Password is required"), "Error should mention password required");
    console.log("✅ T5 passed: hash rejects empty password");
  }

  // T6: compare rejects missing arguments
  try {
    await passHasher.compare("", "hash");
    console.log("❌ T6 failed: should throw for empty plainPassword");
  } catch (error) {
    assert(error.message.includes("Password and hash are required"), "Error should mention both required");
    console.log("✅ T6 passed: compare rejects empty password");
  }

  // T7: compare rejects missing hash
  try {
    await passHasher.compare("pass", "");
    console.log("❌ T7 failed: should throw for empty hash");
  } catch (error) {
    assert(error.message.includes("Password and hash are required"), "Error should mention both required");
    console.log("✅ T7 passed: compare rejects empty hash");
  }

  console.log("\n🎉 PasswordHasher tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
