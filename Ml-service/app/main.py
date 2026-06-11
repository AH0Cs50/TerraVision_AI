import logging
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import time

from app.model import predict
from app.util import load_image_from_bytes, preprocess_image
from app.cloud import get_file_by_key

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Plant Disease Detection API")


# Request schema for plant-specific detection
class PredictRequest(BaseModel):
    user_id: str
    plant_id: str
    key: str
    expected_plant: Optional[str] = None


# Request schema for general detection (no user/plant context)
class GeneralPredictRequest(BaseModel):
    key: str

@app.get("/")
def welcome():
    return {
        "message": "Welcome to the Plant Disease Detection API 🚀",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/predict")
async def predict_disease(data: PredictRequest):

    try:
        logger.info("Predict request: user=%s plant=%s expected=%s", data.user_id, data.plant_id, data.expected_plant)
        
        image_bytes = get_file_by_key(data.key)

        image = load_image_from_bytes(image_bytes)
        image = preprocess_image(image)

        start = time.time()
        result = predict(image, top_k=5, expected_plant=data.expected_plant)
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
        logger.error("Prediction failed: %s", str(e), exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
@app.post("/predict/general")
async def predict_general(data: GeneralPredictRequest):
    try:
        image_bytes = get_file_by_key(data.key)

        image = load_image_from_bytes(image_bytes)
        image = preprocess_image(image)

        start = time.time()
        result = predict(image, top_k=5)
        inference_ms = round((time.time() - start) * 1000, 2)

        return {
            "success": True,
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
        logger.error("General prediction failed: %s", str(e), exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
