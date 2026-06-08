import assert from "assert";
import { s3CloudService, userService } from "../shared/container.js";

async function runTests() {
  console.log("Running S3CloudService Tests...\n");

  // Setup: Create a test user for UUID resolution
  let testUserId;
  try {
    const user = await userService.createUser({
      name: "S3 Test User",
      email: `s3-test-${Date.now()}@example.com`,
      password: "S3TestPass123!",
    });
    testUserId = user.uuid;
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    return;
  }

  const testPlantId = "plant-456";
  const testFileName = "Plant Analysis Photo";

  // =========================
  // Test 1: Validate Image MIME Type - Valid JPEG
  // =========================
  try {
    const isValid = s3CloudService.validateImageMimeType("image/jpeg");

    assert(isValid === true, "JPEG should be valid");
    console.log("✅ Test 1 passed: JPEG validation correct");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // =========================
  // Test 2: Validate Image MIME Type - Valid PNG
  // =========================
  try {
    const isValid = s3CloudService.validateImageMimeType("image/png");

    assert(isValid === true, "PNG should be valid");
    console.log("✅ Test 2 passed: PNG validation correct");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // =========================
  // Test 3: Validate Image MIME Type - Valid WebP
  // =========================
  try {
    const isValid = s3CloudService.validateImageMimeType("image/webp");

    assert(isValid === true, "WebP should be valid");
    console.log("✅ Test 3 passed: WebP validation correct");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // =========================
  // Test 4: Validate Image MIME Type - Invalid Type
  // =========================
  try {
    const isValid = s3CloudService.validateImageMimeType("image/gif");

    assert(isValid === false, "GIF should be invalid");
    console.log("✅ Test 4 passed: Invalid type correctly rejected");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // =========================
  // Test 5: Validate Image MIME Type - Non-image Type
  // =========================
  try {
    const isValid = s3CloudService.validateImageMimeType("video/mp4");

    assert(isValid === false, "Video should be invalid");
    console.log("✅ Test 5 passed: Non-image type correctly rejected");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // =========================
  // Test 6: Build Plant Image Path
  // =========================
  try {
    const path = s3CloudService.buildPlantImagePath({
      userId: testUserId,
      plantId: testPlantId,
      fileName: testFileName,
    });

    assert(
      path.startsWith("plants/"),
      "Path should start with 'plants/'",
    );
    assert(path.includes(testUserId), "Path should contain user UUID");
    assert(path.includes(testPlantId), "Path should contain plant UUID");
    assert(path.includes("images/"), "Path should contain 'images/' folder");
    assert(
      path.includes("plant-analysis-photo"),
      "Path should contain sanitized filename",
    );

    console.log("✅ Test 6 passed: Plant image path built correctly");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  // =========================
  // Test 7: Build Plant Image Path - Special Characters Handling
  // =========================
  try {
    const specialFileName = "My  Plant@Photo #123";
    const path = s3CloudService.buildPlantImagePath({
      userId: testUserId,
      plantId: testPlantId,
      fileName: specialFileName,
    });

    assert(!path.includes("@"), "Path should not contain @");
    assert(!path.includes("#"), "Path should not contain #");
    assert(!path.includes(" "), "Path should not contain spaces");
    assert(path.includes("-"), "Path should contain hyphens for spaces");

    console.log("✅ Test 7 passed: Special characters handled correctly");
  } catch (error) {
    console.error("❌ Test 7 failed:", error.message);
  }

  // =========================
  // Test 8: Validate Plant Image Key - Valid Format
  // =========================
  try {
    const validKey =
      "plants/user-123/plant-456/images/1234567890-test-image.jpg";
    const isValid = s3CloudService.validatePlantImageKey(validKey);

    assert(isValid === true, "Valid key should pass validation");
    console.log("✅ Test 8 passed: Valid plant image key accepted");
  } catch (error) {
    console.error("❌ Test 8 failed:", error.message);
  }

  // =========================
  // Test 9: Validate Plant Image Key - Invalid Format
  // =========================
  try {
    const invalidKey = "invalid/path/format";
    const isValid = s3CloudService.validatePlantImageKey(invalidKey);

    assert(isValid === false, "Invalid key should fail validation");
    console.log("✅ Test 9 passed: Invalid plant image key rejected");
  } catch (error) {
    console.error("❌ Test 9 failed:", error.message);
  }

  // =========================
  // Test 10: Validate Plant Image Key - Null Key
  // =========================
  try {
    const isValid = s3CloudService.validatePlantImageKey(null);

    assert(isValid === false, "Null key should fail validation");
    console.log("✅ Test 10 passed: Null key correctly rejected");
  } catch (error) {
    console.error("❌ Test 10 failed:", error.message);
  }

  // =========================
  // Test 11: Validate Plant Image Key - Empty String
  // =========================
  try {
    const isValid = s3CloudService.validatePlantImageKey("");

    assert(isValid === false, "Empty key should fail validation");
    console.log("✅ Test 11 passed: Empty key correctly rejected");
  } catch (error) {
    console.error("❌ Test 11 failed:", error.message);
  }

  // =========================
  // Test 12: Validate Plant Image Key - Non-String Type
  // =========================
  try {
    const isValid = s3CloudService.validatePlantImageKey(12345);

    assert(isValid === false, "Non-string key should fail validation");
    console.log("✅ Test 12 passed: Non-string key correctly rejected");
  } catch (error) {
    console.error("❌ Test 12 failed:", error.message);
  }

  // =========================
  // Test 13: Generate Upload URL - Valid MIME Type
  // =========================
  try {
    const result = await s3CloudService.generateUploadUrl({
      userId: testUserId,
      plantId: testPlantId,
      fileName: testFileName,
      fileType: "image/jpeg",
    });

    assert(result.uploadUrl, "Should generate upload URL");
    assert(result.key, "Should return S3 key");
    assert(result.expiresIn, "Should return expiration time");
    assert(
      result.uploadUrl.includes("X-Amz-Signature"),
      "URL should be signed",
    );

    console.log("✅ Test 13 passed: Upload URL generated successfully");
  } catch (error) {
    console.error("❌ Test 13 failed:", error.message);
  }

  // =========================
  // Test 14: Generate Upload URL - Invalid MIME Type
  // =========================
  try {
    await s3CloudService.generateUploadUrl({
      userId: testUserId,
      plantId: testPlantId,
      fileName: testFileName,
      fileType: "image/gif",
    });

    console.log(
      "❌ Test 14 failed: Should have thrown error for invalid MIME type",
    );
  } catch (error) {
    assert(
      error.message === "INVALID_FILE_TYPE",
      "Should throw INVALID_FILE_TYPE error",
    );
    console.log("✅ Test 14 passed: Invalid MIME type correctly rejected");
  }

  // =========================
  // Test 15: Generate Get URL
  // =========================
  try {
    const testKey =
      "plants/user-123/plant-456/images/1234567890-test-image.jpg";
    const getUrl = await s3CloudService.generateGetUrl(testKey);

    assert(getUrl, "Should generate GET URL");
    assert(getUrl.includes("X-Amz-Signature"), "URL should be signed");

    console.log("✅ Test 15 passed: GET URL generated successfully");
  } catch (error) {
    console.error("❌ Test 15 failed:", error.message);
  }

  // =========================
  // Test 16: Delete File (skipped if bucket not configured)
  // =========================
  try {
    const testKey =
      "plants/user-123/plant-456/images/1234567890-test-image.jpg";
    const result = await s3CloudService.deleteFile(testKey);

    console.log("✅ Test 16 passed: Delete file operation executed");
  } catch (error) {
    if (error.name === "NoSuchBucket" || error.message?.includes("bucket")) {
      console.log("⚠️  Test 16 skipped: S3 bucket not configured");
    } else {
      console.error("❌ Test 16 failed:", error.message);
    }
  }

  // Cleanup: Delete test user
  try {
    await userService.deleteUser(testUserId);
    console.log("✅ Cleanup: Test user deleted");
  } catch (error) {
    console.error("⚠️ Cleanup warning:", error.message);
  }

  console.log("\n🎉 S3CloudService tests completed\n");
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
