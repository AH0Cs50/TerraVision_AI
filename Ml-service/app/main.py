from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timezone
import time

from app.model import predict
from app.util import load_image_from_bytes, preprocess_image
from app.cloud import get_file_by_key

app = FastAPI(title="Plant Disease Detection API")


# Request schema
class PredictRequest(BaseModel):
    user_id: str
    plant_id: str
    key: str


@app.post("/predict")
async def predict_disease(data: PredictRequest):
    try:
        # get image from S3
        image_bytes = get_file_by_key(data.key)

        # preprocess
        image = load_image_from_bytes(image_bytes)
        image = preprocess_image(image)

        # model prediction (with timing)
        start = time.time()
        result = predict(image, top_k=5)
        inference_ms = round((time.time() - start) * 1000, 2)

        return {
            "success": True,
            "user_id": data.user_id,
            "plant_id": data.plant_id,
            "image_key": data.key,
            "prediction": result,
            "model": {
                "name": "plant-disease-cnn",
                "version": "1.0.0",
                "input_size": [224, 224]
            },
            "processing": {
                "inference_time_ms": inference_ms,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }