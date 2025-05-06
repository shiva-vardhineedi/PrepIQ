import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

bucket = "cmpe-295-team-101"

try:
    res = s3.list_objects_v2(Bucket=bucket)
    print(f"✅ Success! Objects in {bucket}:")
    for obj in res.get("Contents", []):
        print("-", obj["Key"])
except Exception as e:
    print("❌ Still failing:", e)
