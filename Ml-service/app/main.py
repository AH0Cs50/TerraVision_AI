from fastapi import FastAPI
from pydantic import BaseModel

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

        # model prediction
        result = predict(image,top_k=5)

        return {
            "success": True,
            "user_id": data.user_id,
            "plant_id": data.plant_id,
            "prediction": result
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }