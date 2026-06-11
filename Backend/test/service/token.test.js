import assert from "assert";
import TokenService from "../service/common/token.service.js";

async function runTests() {
  console.log("Running TokenService Tests...\n");
  let passed = 0, failed = 0;

  const tokenService = new TokenService();
  const payload = { uuid: "test-uuid-123", email: "test@example.com", role: "user" };

  // Test 1: Generate access token
  try {
    const token = tokenService.generateAccessToken(payload);
    assert(typeof token === "string", "Token should be a string");
    assert(token.split(".").length === 3, "Token should have 3 parts");
    console.log("✅ Test 1 passed: Access token generated");
    passed++;
  } catch (err) { console.error("❌ Test 1 failed:", err.message); failed++; }

  // Test 2: Generate refresh token
  try {
    const token = tokenService.generateRefreshToken(payload);
    assert(typeof token === "string", "Token should be a string");
    assert(token.split(".").length === 3, "Token should have 3 parts");
    console.log("✅ Test 2 passed: Refresh token generated");
    passed++;
  } catch (err) { console.error("❌ Test 2 failed:", err.message); failed++; }

  // Test 3: Verify valid access token
  try {
    const token = tokenService.generateAccessToken(payload);
    const decoded = tokenService.verifyAccessToken(token);
    assert(decoded !== null, "Should decode valid token");
    assert(decoded.uuid === payload.uuid, "UUID should match");
    assert(decoded.role === payload.role, "Role should match");
    console.log("✅ Test 3 passed: Valid access token verified");
    passed++;
  } catch (err) { console.error("❌ Test 3 failed:", err.message); failed++; }

  // Test 4: Verify valid refresh token
  try {
    const token = tokenService.generateRefreshToken(payload);
    const decoded = tokenService.verifyRefreshToken(token);
    assert(decoded !== null, "Should decode valid token");
    console.log("✅ Test 4 passed: Valid refresh token verified");
    passed++;
  } catch (err) { console.error("❌ Test 4 failed:", err.message); failed++; }

  // Test 5: Verify invalid access token returns null
  try {
    const decoded = tokenService.verifyAccessToken("invalid.token.here");
    assert(decoded === null, "Invalid token should return null");
    console.log("✅ Test 5 passed: Invalid access token rejected");
    passed++;
  } catch (err) { console.error("❌ Test 5 failed:", err.message); failed++; }

  // Test 6: Verify invalid refresh token returns null
  try {
    const decoded = tokenService.verifyRefreshToken("bad.token.string");
    assert(decoded === null, "Invalid token should return null");
    console.log("✅ Test 6 passed: Invalid refresh token rejected");
    passed++;
  } catch (err) { console.error("❌ Test 6 failed:", err.message); failed++; }

  // Test 7: Wrong secret doesn't verify
  try {
    const accessToken = tokenService.generateAccessToken(payload);
    const decoded = tokenService.verifyRefreshToken(accessToken);
    assert(decoded === null, "Access token should not verify as refresh");
    console.log("✅ Test 7 passed: Wrong secret correctly fails");
    passed++;
  } catch (err) { console.error("❌ Test 7 failed:", err.message); failed++; }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => { console.error("Fatal:", err); process.exit(1); });
