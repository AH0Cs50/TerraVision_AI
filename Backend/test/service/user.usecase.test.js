import assert from "assert";
import { signup } from "../../usecases/auth.usecases.js";
import { getUser, updateUser, deleteUser, sendVerificationEmail, verifyEmail, getEmailStatus } from "../../usecases/user.usecases.js";
import { userRepo } from "../../shared/container.js";

async function runTests() {
  console.log("Running User UseCase Tests...\n");

  const testEmail = `test-user-${Date.now()}@example.com`;
  let createdUser = null;

  // Create a test user via signup
  try {
    const result = await signup({
      name: "User Test",
      email: testEmail,
      password: "TestPass123!",
      location: { city: "Gaza" },
    });
    createdUser = result.user;
    console.log("🔧 Test user created:", createdUser.uuid);
  } catch (error) {
    console.error("❌ Failed to create test user:", error.message);
    process.exit(1);
  }

  // Test 1: getUser (self-lookup)
  try {
    const userObj = await getUser(createdUser.uuid, { uuid: createdUser.uuid, role: "user" });

    assert(userObj !== null, "User should exist");
    assert(userObj.uuid === createdUser.uuid, "UUID mismatch");
    assert(userObj.name === "User Test", `Name mismatch: ${userObj.name}`);
    assert(userObj.email === testEmail, `Email mismatch: ${userObj.email}`);

    console.log("✅ Test 1 passed: getUser returns safe user object");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // Test 2: find by email (via repo)
  try {
    const rawUser = await userRepo.findByEmail(testEmail);

    assert(rawUser !== null, "User should be found by email");
    assert(rawUser.email === testEmail, "Email mismatch");
    assert(rawUser.name === "User Test", "Name mismatch");
    assert(rawUser.uuid === createdUser.uuid, "UUID mismatch");

    console.log("✅ Test 2 passed: findByEmail via repo works");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // Test 3: updateUser
  try {
    const updated = await updateUser(
      createdUser.uuid,
      { name: "Updated Name" },
      { uuid: createdUser.uuid, role: "user" },
    );

    assert(updated !== null, "Updated user should exist");
    assert(updated.name === "Updated Name", `Name should be updated: ${updated.name}`);
    assert(updated.uuid === createdUser.uuid, "UUID should remain same");
    assert(updated.email === testEmail, "Email should remain same");

    console.log("✅ Test 3 passed: updateUser returns updated safe user");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // Test 4: sendVerificationEmail
  try {
    const result = await sendVerificationEmail(createdUser.uuid);

    assert(result.message === "Verification email sent", `Wrong message: ${result.message}`);

    console.log("✅ Test 4 passed: sendVerificationEmail returns message");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // Test 5: verifyEmail
  try {
    const rawUser = await userRepo.findByEmail(testEmail);
    assert(rawUser.emailToken, "emailToken should exist after sendVerificationEmail");

    const verifyResult = await verifyEmail(rawUser.emailToken);
    assert(verifyResult.message === "Email verified successfully", `Wrong verify message: ${verifyResult.message}`);

    console.log("✅ Test 5 passed: verifyEmail works");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // Test 6: getEmailStatus
  try {
    const status = await getEmailStatus(createdUser.uuid);

    assert(status !== null, "Status should exist");
    assert(status.email === testEmail, `Email mismatch: ${status.email}`);
    assert(status.isVerified === true, `Email should be verified, got: ${status.isVerified}`);

    console.log("✅ Test 6 passed: getEmailStatus shows verified");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  // Test 7: deleteUser
  try {
    const deleteResult = await deleteUser(createdUser.uuid, { uuid: createdUser.uuid, role: "user" });

    assert(deleteResult === 1, `Should delete 1 document, got: ${deleteResult}`);

    const checkUser = await userRepo.findByUUID(createdUser.uuid);
    assert(checkUser === null, "User should be deleted");

    console.log("✅ Test 7 passed: deleteUser removes user");
  } catch (error) {
    console.error("❌ Test 7 failed:", error.message);
  }

  // Final cleanup (belt-and-suspenders)
  try {
    const leftover = await userRepo.findByEmail(testEmail);
    if (leftover) await userRepo.deleteByUUID(leftover.uuid);
  } catch {}

  console.log("\n🎉 User UseCase tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
