"""Virus scanner Lambda — scans S3 uploads with ClamAV.

Triggered by s3:ObjectCreated:* events on the uploads bucket.
Downloads the file, scans with clamscan, and tags the S3 object:
  - clean: scan-status=clean
  - infected: scan-status=infected, moved to quarantine, SQS alert
  - failure: scan-status=pending, sent to DLQ for manual review
"""

import json
import logging
import os
import subprocess
import tempfile

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")
sqs = boto3.client("sqs")

QUARANTINE_BUCKET = os.environ.get("QUARANTINE_BUCKET", "")
DLQ_URL = os.environ.get("DLQ_URL", "")
ADMIN_QUEUE_URL = os.environ.get("ADMIN_QUEUE_URL", "")


def lambda_handler(event, context):
    """Process S3 event records and scan each uploaded file."""
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        logger.info(f"Scanning {bucket}/{key}")

        try:
            _scan_file(bucket, key)
        except Exception as exc:
            logger.error(f"Scan failed for {bucket}/{key}: {exc}")
            _tag_object(bucket, key, "pending")
            _send_to_dlq(bucket, key, str(exc))


def _scan_file(bucket: str, key: str) -> None:
    """Download, scan, and act on the result."""
    with tempfile.NamedTemporaryFile(delete=True) as tmp:
        s3.download_file(bucket, key, tmp.name)

        result = subprocess.run(
            ["clamscan", "--no-summary", tmp.name],
            capture_output=True,
            text=True,
            timeout=240,
        )

    if result.returncode == 0:
        # Clean
        _tag_object(bucket, key, "clean")
        logger.info(f"CLEAN: {bucket}/{key}")

    elif result.returncode == 1:
        # Infected
        threat = result.stdout.strip().split(":")[-1].strip() if result.stdout else "unknown"
        _tag_object(bucket, key, "infected")
        _quarantine(bucket, key)
        _notify_admin(bucket, key, threat)
        logger.warning(f"INFECTED: {bucket}/{key} — {threat}")

    else:
        # Scanner error
        _tag_object(bucket, key, "pending")
        _send_to_dlq(bucket, key, f"clamscan exit code {result.returncode}: {result.stderr}")
        logger.error(f"SCAN ERROR: {bucket}/{key} — {result.stderr}")


def _tag_object(bucket: str, key: str, status: str) -> None:
    """Set scan-status tag on the S3 object."""
    s3.put_object_tagging(
        Bucket=bucket,
        Key=key,
        Tagging={"TagSet": [{"Key": "scan-status", "Value": status}]},
    )


def _quarantine(bucket: str, key: str) -> None:
    """Move infected file to quarantine bucket."""
    if not QUARANTINE_BUCKET:
        return
    s3.copy_object(
        Bucket=QUARANTINE_BUCKET,
        Key=f"quarantine/{key}",
        CopySource={"Bucket": bucket, "Key": key},
    )
    s3.delete_object(Bucket=bucket, Key=key)


def _notify_admin(bucket: str, key: str, threat: str) -> None:
    """Publish SQS notification for admin alerting."""
    if not ADMIN_QUEUE_URL:
        return
    sqs.send_message(
        QueueUrl=ADMIN_QUEUE_URL,
        MessageBody=json.dumps({
            "type": "virus_detected",
            "bucket": bucket,
            "key": key,
            "threat": threat,
        }),
    )


def _send_to_dlq(bucket: str, key: str, error: str) -> None:
    """Send failed scan to dead-letter queue for manual review."""
    if not DLQ_URL:
        return
    sqs.send_message(
        QueueUrl=DLQ_URL,
        MessageBody=json.dumps({
            "type": "scan_failure",
            "bucket": bucket,
            "key": key,
            "error": error,
        }),
    )
