from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / "config.env"
load_dotenv(dotenv_path=env_path)

# Environment variables
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_REGION = os.getenv("S3_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_ENDPOINT = os.getenv("S3_ENDPOINT")
S3_FORCE_PATH_STYLE = os.getenv("S3_FORCE_PATH_STYLE", "true").lower() == "true"

# Basic safety check (recommended)
if not all([S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION, S3_BUCKET_NAME]):
    raise ValueError("Missing required S3 environment variables")


cloudConfig = {
    "S3_ENDPOINT": S3_ENDPOINT,
    "S3_REGION": S3_REGION,
    "S3_ACCESS_KEY": S3_ACCESS_KEY,
    "S3_SECRET_KEY": S3_SECRET_KEY,
    "S3_BUCKET_NAME": S3_BUCKET_NAME,
    "S3_FORCE_PATH_STYLE": S3_FORCE_PATH_STYLE
}
