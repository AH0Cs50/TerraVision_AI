import os
from model import predict
from util import preprocess_image


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_FOLDER = os.path.join(BASE_DIR, "..", "test_images")

print("Test folder:", TEST_FOLDER)
print("Exists:", os.path.exists(TEST_FOLDER))


def run_tests():
    print("Running predictions on test images...\n")

    for filename in os.listdir(TEST_FOLDER):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            path = os.path.join(TEST_FOLDER, filename)

            try:
                image = preprocess_image(path)
                result = predict(image)
                
                print(f"{filename}")
                print(f"Prediction: {result['class']}")
                print(f"Confidence: {result['confidence']:.4f}\n")

            except Exception as e:
                print(f" Error processing {filename}: {e}\n")

run_tests()
