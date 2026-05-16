from dotenv import load_dotenv
import os

load_dotenv()

# Environment variables
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_REGION = os.getenv("S3_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_ENDPOINT = os.getenv("S3_ENDPOINT")

# Basic safety check (recommended)
if not all([S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION, S3_BUCKET_NAME]):
    raise ValueError("Missing required S3 environment variables")


cloudConfig = {
    "S3_ENDPOINT": S3_ENDPOINT,
    "S3_REGION": S3_REGION,
    "S3_ACCESS_KEY": S3_ACCESS_KEY,
    "S3_SECRET_KEY": S3_SECRET_KEY,
    "S3_BUCKET_NAME": S3_BUCKET_NAME
}
