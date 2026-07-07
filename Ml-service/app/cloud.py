import boto3
from botocore.config import Config
from app.config import cloudConfig

s3_config = Config(
    s3={"addressing_style": "path"} if cloudConfig["S3_FORCE_PATH_STYLE"] else {}
)

s3_client = boto3.client(
    "s3",
    aws_access_key_id=cloudConfig['S3_ACCESS_KEY'],
    aws_secret_access_key=cloudConfig['S3_SECRET_KEY'],
    region_name=cloudConfig['S3_REGION'],
    endpoint_url=cloudConfig['S3_ENDPOINT'],
    config=s3_config,
    verify=False
)

BUCKET_NAME = cloudConfig['S3_BUCKET_NAME']

def get_file_by_key(key: str) -> bytes:
    """
    Fetch file from S3 and return its content as bytes.
    Raises ValueError if the object is empty or not an image type.
    """
    response = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)

    content_type = response.get("ContentType", "")
    if not content_type.startswith("image/"):
        raise ValueError(
            f"S3 object at '{key}' has ContentType '{content_type}', expected image/*"
        )

    body = response["Body"].read()
    if not body:
        raise ValueError(f"S3 object at '{key}' is empty")

    return body

def get_file_text(key: str, encoding: str = "utf-8") -> str:
    """
    Fetch file from S3 and return as string.
    """
    data = get_file_by_key(key)
    return data.decode(encoding)

def upload_file(file_path: str, key: str):
    """
    Upload a local file to S3.
    """
    s3_client.upload_file(file_path, BUCKET_NAME, key)
    return f"Uploaded {key}"

def upload_bytes(data: bytes, key: str, content_type: str = "application/octet-stream"):
    """
    Upload raw bytes to S3.
    """
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=key,
        Body=data,
        ContentType=content_type
    )
    return f"Uploaded {key}"

def list_files(prefix: str = ""):
    """
    List objects in S3 bucket.
    """
    response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=prefix)

    if "Contents" not in response:
        return []

    return [obj["Key"] for obj in response["Contents"]]

def delete_file(key: str):
    """
    Delete object from S3.
    """
    s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
    return f"Deleted {key}"

def file_exists(key: str) -> bool:
    """
    Check if a file exists in S3.
    """
    try:
        s3_client.head_object(Bucket=BUCKET_NAME, Key=key)
        return True
    except Exception:
        return False
    
