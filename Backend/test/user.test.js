import assert from "assert";
import { userService } from "../shared/container.js";
import RouteError from "../shared/util/RouteError.js";
import HttpStatusCodes from "../shared/util/HttpStatusCodes.js";

async function runTests() {
  console.log("Running UserService Tests...\n");

  // Test Data
  const testUserData = {
    name: "Jane Smith",
    email: `user-test-${Date.now()}@example.com`,
    password: "TestPass123!",
    location: { city: "Gaza" },
  };

  let createdUser = null;
  let createdUserInternalId = null;

  // =========================
  // Test 1: Create User
  // =========================
  try {
    createdUser = await userService.createUser(testUserData);

    assert(
      createdUser.email === testUserData.email.toLowerCase().trim(),
      "Email mismatch",
    );
    assert(createdUser.name === testUserData.name, "Name mismatch");
    assert(createdUser.uuid, "UUID not generated");
    assert(createdUser.internalId, "Internal ID not generated");

    createdUserInternalId = createdUser.internalId;
    console.log("✅ Test 1 passed: User created successfully");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
    return;
  }

  // =========================
  // Test 2: Find User by UUID
  // =========================
  try {
    const foundUser = await userService.findByUUID(createdUser.uuid);

    assert(foundUser.uuid === createdUser.uuid, "UUID mismatch");
    assert(foundUser.email === createdUser.email, "Email mismatch on find");
    console.log("✅ Test 2 passed: User found by UUID");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // =========================
  // Test 3: Find User by Internal ID
  // =========================
  try {
    const foundUser = await userService.findByInternalId(createdUserInternalId);

    assert(
      foundUser.internalId === createdUserInternalId,
      "Internal ID mismatch",
    );
    assert(
      foundUser.email === testUserData.email.toLowerCase().trim(),
      "Email mismatch",
    );
    console.log("✅ Test 3 passed: User found by Internal ID");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // =========================
  // Test 4: Find User by Email
  // =========================
  try {
    const foundUser = await userService.findByEmail(testUserData.email);

    assert(
      foundUser.email === testUserData.email.toLowerCase().trim(),
      "Email mismatch",
    );
    assert(
      foundUser.uuid === createdUser.uuid,
      "UUID mismatch on email search",
    );
    console.log("✅ Test 4 passed: User found by Email");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // =========================
  // Test 5: Set Refresh Token
  // =========================
  try {
    const testToken = "test-refresh-token-" + Date.now();
    const result = await userService.setRefreshToken(
      createdUserInternalId,
      testToken,
    );

    assert(
      result.refreshToken === testToken,
      "Refresh token not set correctly",
    );
    console.log("✅ Test 5 passed: Refresh token set successfully");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // =========================
  // Test 6: Verify User
  // =========================
  try {
    const result = await userService.verifyUser(createdUserInternalId);

    assert(result.isVerified === true, "User not verified");
    console.log("✅ Test 6 passed: User verified successfully");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  // =========================
  // Test 7: Clear Refresh Token
  // =========================
  try {
    const result = await userService.clearRefreshToken(createdUserInternalId);

    assert(result.refreshToken === null, "Refresh token not cleared");
    console.log("✅ Test 7 passed: Refresh token cleared successfully");
  } catch (error) {
    console.error("❌ Test 7 failed:", error.message);
  }

  // =========================
  // Test 8: Create User without Email (Should fail)
  // =========================
  try {
    await userService.createUser({
      name: "No Email User",
      password: "password",
      location: { city: "Gaza" },
    });
    console.log("❌ Test 8 failed: Should have thrown error for missing email");
  } catch (error) {
    assert(error instanceof RouteError, "Should throw RouteError");
    assert(
      error.statusCode === HttpStatusCodes.BAD_REQUEST,
      "Wrong status code",
    );
    console.log("✅ Test 8 passed: Missing email correctly rejected");
  }

  // =========================
  // Test 9: Duplicate Email (Should fail)
  // =========================
  try {
    await userService.createUser({
      name: "Another User",
      email: testUserData.email,
      password: "password",
      location: { city: "Gaza" },
    });
    console.log(
      "❌ Test 9 failed: Should have thrown error for duplicate email",
    );
  } catch (error) {
    assert(error instanceof RouteError, "Should throw RouteError");
    assert(error.statusCode === HttpStatusCodes.CONFLICT, "Wrong status code");
    console.log("✅ Test 9 passed: Duplicate email correctly rejected");
  }

  // =========================
  // Test 10: Delete User
  // =========================
  try {
    const result = await userService.deleteUser(createdUserInternalId);

    assert(result >= 1, "User not deleted");
    console.log("✅ Test 10 passed: User deleted successfully");
  } catch (error) {
    console.error("❌ Test 10 failed:", error.message);
  }

  // =========================
  // Test 11: Find Deleted User (Should fail)
  // =========================
  try {
    await userService.findByInternalId(createdUserInternalId);
    console.log(
      "❌ Test 11 failed: Should have thrown error for non-existent user",
    );
  } catch (error) {
    assert(error instanceof RouteError, "Should throw RouteError");
    assert(error.statusCode === HttpStatusCodes.NOT_FOUND, "Wrong status code");
    console.log("✅ Test 11 passed: Deleted user correctly not found");
  }

  console.log("\n🎉 UserService tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
