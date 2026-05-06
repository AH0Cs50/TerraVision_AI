import os
from model import predict
from util import preprocess_image

TEST_FOLDER = "test_images"

def run_tests():
    print("🔍 Running predictions on test images...\n")

    for filename in os.listdir(TEST_FOLDER):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            path = os.path.join(TEST_FOLDER, filename)

            try:
                image = preprocess_image(path)
                label, confidence = predict(image)

                print(f"📷 {filename}")
                print(f"   ➤ Prediction: {label}")
                print(f"   ➤ Confidence: {confidence:.4f}\n")

            except Exception as e:
                print(f"❌ Error processing {filename}: {e}\n")

if __name__ == "__main__":
    run_tests()