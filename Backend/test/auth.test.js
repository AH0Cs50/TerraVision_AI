import assert from "assert";
import { authService, userService } from "../shared/container.js";
import RouteError from "../shared/util/RouteError.js";

async function runTests() {
  console.log("Running AuthService Tests...\n");

  // Test Data
  const testUserData = {
    name: "John Doe",
    email: `test-${Date.now()}@example.com`,
    password: "SecurePass123!",
    location: "Gaza Strip",
  };

  let signupResult = null;
  let refreshToken = null;

  // =========================
  // Test 1: Signup
  // =========================
  try {
    signupResult = await authService.signup(testUserData);

    assert(signupResult.user.email === testUserData.email, "Email mismatch");
    assert(signupResult.user.name === testUserData.name, "Name mismatch");
    assert(signupResult.tokens.accessToken, "Access token not generated");
    assert(signupResult.tokens.refreshToken, "Refresh token not generated");
    refreshToken = signupResult.tokens.refreshToken;

    console.log("✅ Test 1 passed: Signup successful");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // =========================
  // Test 2: Duplicate Email (Should fail)
  // =========================
  try {
    await authService.signup({
      ...testUserData,
      name: "Different Name",
    });
    console.log(
      "❌ Test 2 failed: Should have thrown error for duplicate email",
    );
  } catch (error) {
    assert(error instanceof RouteError, "Should throw RouteError");
    assert(error.message === "Email already exists", "Wrong error message");
    console.log("✅ Test 2 passed: Duplicate email correctly rejected");
  }

  // =========================
  // Test 3: Login
  // =========================
  try {
    const loginResult = await authService.login({
      email: testUserData.email,
      password: testUserData.password,
    });

    assert(
      loginResult.user.email === testUserData.email,
      "Email mismatch on login",
    );
    assert(
      loginResult.tokens.accessToken,
      "Access token not returned on login",
    );
    assert(
      loginResult.tokens.refreshToken,
      "Refresh token not returned on login",
    );

    console.log("✅ Test 3 passed: Login successful");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // =========================
  // Test 4: Login with Wrong Password (Should fail)
  // =========================
  try {
    await authService.login({
      email: testUserData.email,
      password: "WrongPassword123!",
    });
    console.log(
      "❌ Test 4 failed: Should have thrown error for invalid password",
    );
  } catch (error) {
    assert(error instanceof RouteError, "Should throw RouteError");
    console.log("✅ Test 4 passed: Wrong password correctly rejected");
  }

  // =========================
  // Test 5: Refresh Token
  // =========================
  try {
    const refreshResult = await authService.refresh(refreshToken);

    assert(refreshResult.accessToken, "New access token not generated");
    assert(refreshResult.refreshToken, "New refresh token not generated");
    assert(
      refreshResult.accessToken !== signupResult.tokens.accessToken,
      "Access token should be different",
    );

    console.log("✅ Test 5 passed: Token refresh successful");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // =========================
  // Test 6: Logout
  // =========================
  try {
    const user = await userService.findByEmail(testUserData.email);
    const logoutResult = await authService.logout(user.internalId);

    assert(
      logoutResult.message === "Logged out successfully",
      "Wrong logout message",
    );
    console.log("✅ Test 6 passed: Logout successful");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  console.log("\n🎉 AuthService tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
