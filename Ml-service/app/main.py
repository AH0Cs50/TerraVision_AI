from fastapi import FastAPI, UploadFile, File
from app.model import predict
from app.util import preprocess_image

app = FastAPI(title="Plant Disease Detection API")

@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):
    try:
        image = preprocess_image(file.file)
        result = predict(image)

        return {
            "success": True,
            "prediction": result
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }