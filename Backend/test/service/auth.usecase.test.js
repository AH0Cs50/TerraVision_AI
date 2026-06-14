import assert from "assert";
import { signup, login, logout, refresh } from "../../usecases/auth.usecases.js";
import { userRepo } from "../../shared/container.js";
import RouteError from "../../shared/util/RouteError.js";
import HttpStatusCodes from "../../shared/util/HttpStatusCodes.js";

async function runTests() {
  console.log("Running Auth UseCase Tests...\n");

  const testEmail = `test-auth-${Date.now()}@example.com`;
  let signupResult = null;
  let loginResult = null;

  // Test 1: Signup
  try {
    signupResult = await signup({ name: "Test User", email: testEmail, password: "TestPass123!", location: { city: "Gaza" } });

    assert(signupResult.user.email === testEmail, "Email mismatch");
    assert(signupResult.user.name === "Test User", "Name mismatch");
    assert(signupResult.user.uuid, "UUID not generated");
    assert(signupResult.user.role === "user", "Role should be user");
    assert(signupResult.tokens.accessToken, "Access token not generated");
    assert(signupResult.tokens.refreshToken, "Refresh token not generated");

    console.log("✅ Test 1 passed: Signup successful");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // Test 2: Duplicate email -> RouteError CONFLICT
  try {
    await signup({ name: "Another User", email: testEmail, password: "OtherPass123!", location: { city: "Khan Younis" } });
    console.log("❌ Test 2 failed: Should have thrown for duplicate email");
  } catch (error) {
    try {
      assert(error instanceof RouteError, "Should throw RouteError");
      assert(error.statusCode === HttpStatusCodes.CONFLICT, "Should be 409");
      assert(error.message === "Email already exists", `Wrong message: ${error.message}`);
      console.log("✅ Test 2 passed: Duplicate email correctly rejected");
    } catch (assertError) {
      console.error("❌ Test 2 failed:", assertError.message);
    }
  }

  // Test 3: Login
  try {
    loginResult = await login({ email: testEmail, password: "TestPass123!" });

    assert(loginResult.user.email === testEmail, "Email mismatch on login");
    assert(loginResult.tokens.accessToken, "Access token not returned on login");
    assert(loginResult.tokens.refreshToken, "Refresh token not returned on login");

    console.log("✅ Test 3 passed: Login successful");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // Test 4: Wrong password -> RouteError UNAUTHORIZED
  try {
    await login({ email: testEmail, password: "WrongPassword123!" });
    console.log("❌ Test 4 failed: Should have thrown for wrong password");
  } catch (error) {
    try {
      assert(error instanceof RouteError, "Should throw RouteError");
      assert(error.statusCode === HttpStatusCodes.UNAUTHORIZED, "Should be 401");
      console.log("✅ Test 4 passed: Wrong password correctly rejected");
    } catch (assertError) {
      console.error("❌ Test 4 failed:", assertError.message);
    }
  }

  // Test 5: Refresh token (1s delay for different iat)
  try {
    await new Promise((r) => setTimeout(r, 1100));
    const refreshResult = await refresh(loginResult.tokens.refreshToken);

    assert(refreshResult.accessToken, "New access token not generated");
    assert(refreshResult.refreshToken, "New refresh token not generated");
    assert(refreshResult.accessToken !== loginResult.tokens.accessToken, "Access token should be different");

    console.log("✅ Test 5 passed: Token refresh successful");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // Test 6: Logout
  try {
    const logoutResult = await logout(signupResult.user.uuid);
    assert(logoutResult.message === "Logged out successfully", `Wrong logout message: ${logoutResult.message}`);
    console.log("✅ Test 6 passed: Logout successful");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  // Cleanup
  try {
    const user = await userRepo.findByEmail(testEmail);
    if (user) await userRepo.deleteByUUID(user.uuid);
    console.log("🧹 Cleanup complete");
  } catch {}

  console.log("\n🎉 Auth UseCase tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
