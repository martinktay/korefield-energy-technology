"""Property-based tests for virus scanner Lambda action correctness.

Uses hypothesis to verify that the virus scanner handler correctly tags
S3 objects based on ClamAV scan results: clean files are tagged
scan-status=clean, infected files are tagged scan-status=infected,
moved to quarantine, and an SQS notification is published.

All external dependencies (S3, SQS, ClamAV subprocess) are mocked so
tests run without AWS credentials or a ClamAV installation.

Each test references its design document property and validates specific
requirements from the production-readiness-hardening spec.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch, call

import pytest
from hypothesis import given, settings as h_settings, strategies as st

import handler


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# S3 bucket names: lowercase alphanumeric, 3-63 chars
_bucket_st = st.from_regex(r"[a-z][a-z0-9\-]{2,30}", fullmatch=True)

# S3 object keys: printable path-like strings
_key_st = st.from_regex(r"uploads/[a-zA-Z0-9_\-]{1,40}\.[a-z]{2,5}", fullmatch=True)

# Threat names reported by ClamAV
_threat_st = st.from_regex(r"[A-Za-z0-9\.\-]{3,30}", fullmatch=True)


def _make_s3_event(bucket: str, key: str) -> dict:
    """Build a minimal S3 event record matching the Lambda trigger format."""
    return {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": bucket},
                    "object": {"key": key},
                },
            }
        ],
    }


# ---------------------------------------------------------------------------
# Property 20: Virus Scanner Action Correctness
# Feature: production-readiness-hardening, Property 20
# Validates: Requirements 11.2, 11.3, 11.4
# ---------------------------------------------------------------------------


class TestVirusScannerActionCorrectness:
    """Property 20: Virus Scanner Action Correctness.

    For any uploaded file, after scanning: clean files are tagged
    scan-status=clean; infected files are tagged scan-status=infected,
    moved to quarantine, and an SQS notification is published.

    **Validates: Requirements 11.2, 11.3, 11.4**
    """

    # ---------------------------------------------------------------
    # 11.2  Clean files are tagged scan-status: clean
    # ---------------------------------------------------------------

    @given(bucket=_bucket_st, key=_key_st)
    @h_settings(max_examples=100, deadline=None)
    def test_clean_file_tagged_clean(self, bucket: str, key: str) -> None:
        """For any uploaded file that ClamAV reports as clean (exit
        code 0), the S3 object must be tagged scan-status=clean."""
        mock_s3 = MagicMock()
        mock_sqs = MagicMock()

        clean_result = MagicMock()
        clean_result.returncode = 0
        clean_result.stdout = ""
        clean_result.stderr = ""

        event = _make_s3_event(bucket, key)

        with (
            patch.object(handler, "s3", mock_s3),
            patch.object(handler, "sqs", mock_sqs),
            patch("handler.subprocess") as mock_subprocess,
            patch.object(handler, "QUARANTINE_BUCKET", "quarantine-bucket"),
            patch.object(handler, "ADMIN_QUEUE_URL", "https://sqs.example.com/admin"),
            patch.object(handler, "DLQ_URL", "https://sqs.example.com/dlq"),
        ):
            mock_subprocess.run.return_value = clean_result
            handler.lambda_handler(event, None)

        # Verify S3 tagging with scan-status=clean
        mock_s3.put_object_tagging.assert_called_once_with(
            Bucket=bucket,
            Key=key,
            Tagging={"TagSet": [{"Key": "scan-status", "Value": "clean"}]},
        )

        # Clean files should NOT be quarantined
        mock_s3.copy_object.assert_not_called()
        mock_s3.delete_object.assert_not_called()

        # Clean files should NOT trigger SQS admin notification
        mock_sqs.send_message.assert_not_called()

    # ---------------------------------------------------------------
    # 11.2 + 11.3 + 11.4  Infected files: tagged, quarantined, notified
    # ---------------------------------------------------------------

    @given(bucket=_bucket_st, key=_key_st, threat=_threat_st)
    @h_settings(max_examples=100, deadline=None)
    def test_infected_file_tagged_quarantined_and_notified(
        self, bucket: str, key: str, threat: str
    ) -> None:
        """For any uploaded file that ClamAV reports as infected (exit
        code 1), the handler must:
        1. Tag the S3 object with scan-status=infected
        2. Move the file to the quarantine bucket
        3. Publish an SQS notification with file key and threat name
        """
        mock_s3 = MagicMock()
        mock_sqs = MagicMock()

        infected_result = MagicMock()
        infected_result.returncode = 1
        infected_result.stdout = f"/tmp/file: {threat} FOUND"
        infected_result.stderr = ""

        quarantine_bucket = "quarantine-bucket"
        admin_queue_url = "https://sqs.example.com/admin"
        event = _make_s3_event(bucket, key)

        with (
            patch.object(handler, "s3", mock_s3),
            patch.object(handler, "sqs", mock_sqs),
            patch("handler.subprocess") as mock_subprocess,
            patch.object(handler, "QUARANTINE_BUCKET", quarantine_bucket),
            patch.object(handler, "ADMIN_QUEUE_URL", admin_queue_url),
            patch.object(handler, "DLQ_URL", "https://sqs.example.com/dlq"),
        ):
            mock_subprocess.run.return_value = infected_result
            handler.lambda_handler(event, None)

        # 1. Verify S3 tagging with scan-status=infected
        tag_calls = mock_s3.put_object_tagging.call_args_list
        assert len(tag_calls) == 1
        assert tag_calls[0] == call(
            Bucket=bucket,
            Key=key,
            Tagging={"TagSet": [{"Key": "scan-status", "Value": "infected"}]},
        )

        # 2. Verify file moved to quarantine bucket
        mock_s3.copy_object.assert_called_once_with(
            Bucket=quarantine_bucket,
            Key=f"quarantine/{key}",
            CopySource={"Bucket": bucket, "Key": key},
        )
        mock_s3.delete_object.assert_called_once_with(Bucket=bucket, Key=key)

        # 3. Verify SQS notification published
        mock_sqs.send_message.assert_called_once()
        sqs_call = mock_sqs.send_message.call_args
        assert sqs_call.kwargs["QueueUrl"] == admin_queue_url
        body = json.loads(sqs_call.kwargs["MessageBody"])
        assert body["type"] == "virus_detected"
        assert body["bucket"] == bucket
        assert body["key"] == key
        assert "threat" in body

    # ---------------------------------------------------------------
    # Combined: scan result determines exactly one action path
    # ---------------------------------------------------------------

    @given(
        bucket=_bucket_st,
        key=_key_st,
        is_infected=st.booleans(),
        threat=_threat_st,
    )
    @h_settings(max_examples=100, deadline=None)
    def test_scan_result_determines_action_path(
        self, bucket: str, key: str, is_infected: bool, threat: str
    ) -> None:
        """For any uploaded file and any scan outcome (clean or infected),
        exactly one action path is taken: clean files are only tagged,
        infected files are tagged + quarantined + notified."""
        mock_s3 = MagicMock()
        mock_sqs = MagicMock()

        scan_result = MagicMock()
        scan_result.returncode = 1 if is_infected else 0
        scan_result.stdout = f"/tmp/file: {threat} FOUND" if is_infected else ""
        scan_result.stderr = ""

        quarantine_bucket = "quarantine-bucket"
        admin_queue_url = "https://sqs.example.com/admin"
        event = _make_s3_event(bucket, key)

        with (
            patch.object(handler, "s3", mock_s3),
            patch.object(handler, "sqs", mock_sqs),
            patch("handler.subprocess") as mock_subprocess,
            patch.object(handler, "QUARANTINE_BUCKET", quarantine_bucket),
            patch.object(handler, "ADMIN_QUEUE_URL", admin_queue_url),
            patch.object(handler, "DLQ_URL", "https://sqs.example.com/dlq"),
        ):
            mock_subprocess.run.return_value = scan_result
            handler.lambda_handler(event, None)

        if is_infected:
            # Infected: tagged infected, quarantined, SQS notified
            expected_tag = "infected"
            assert mock_s3.copy_object.call_count == 1, (
                "Infected file must be copied to quarantine"
            )
            assert mock_s3.delete_object.call_count == 1, (
                "Infected file must be deleted from source"
            )
            assert mock_sqs.send_message.call_count == 1, (
                "Infected file must trigger SQS notification"
            )
        else:
            # Clean: tagged clean, no quarantine, no SQS
            expected_tag = "clean"
            assert mock_s3.copy_object.call_count == 0, (
                "Clean file must NOT be quarantined"
            )
            assert mock_s3.delete_object.call_count == 0, (
                "Clean file must NOT be deleted"
            )
            assert mock_sqs.send_message.call_count == 0, (
                "Clean file must NOT trigger SQS notification"
            )

        # Verify the correct tag was applied
        mock_s3.put_object_tagging.assert_called_once_with(
            Bucket=bucket,
            Key=key,
            Tagging={"TagSet": [{"Key": "scan-status", "Value": expected_tag}]},
        )
