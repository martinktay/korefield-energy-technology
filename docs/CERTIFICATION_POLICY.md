# Certification Policy — KoreField Academy

## Certificate Issuance

Certificates are issued only when ALL 6 eligibility conditions are met. No exceptions.

### Composite Eligibility Check (CEL-*)

| # | Condition | Description |
|---|-----------|-------------|
| 1 | Foundation complete | All 5 AI Foundation School modules completed |
| 2 | All levels complete | Beginner + Intermediate + Advanced levels passed for the Track |
| 3 | Pod deliverables submitted | Working prototype, documentation, governance checklist, sprint reviews, final presentation |
| 4 | Capstone passed | Capstone project submitted and defense passed with panel of 2+ assessors |
| 5 | Assessor approved | Assessor has formally approved certification eligibility |
| 6 | Payment cleared | No outstanding payment balances |

### Blocking Conditions

Certificate issuance is blocked if ANY of the following apply:
- Attendance-only participation (no deliverables)
- Partial completion of any level
- Incomplete pod deliverables
- No assessor approval
- Outstanding payment balance

## Capstone Process

1. **Unlock**: Only when all Advanced Level gates passed AND assessor validates readiness
2. **Submit**: Learner submits capstone project (CPS-*)
3. **Defense**: Scheduled within 14 days with panel of 2+ assessors
4. **Result**: Pass or fail with written feedback
5. **Resubmission**: One resubmission allowed within 30 days on failure

## Certificate Format

Each certificate includes:
- Learner name
- Track name
- Completion date
- Certificate ID: `CRT-{unique_segment}`
- Verification code: `KFCERT-{YEAR}-{ALPHANUMERIC}` (e.g., `KFCERT-2026-A7X9K2M4`)

## Public Verification

- Public endpoint: `GET /certification/certificates/{KFCERT-*}/verify`
- No authentication required
- Returns certificate validity status (active or revoked)

## Revocation

- Admin-only operation
- Revocation reason recorded
- Public verification endpoint reflects revoked status
- Revoked certificates cannot be reinstated without re-issuance

## Certificate Generation

- PDF generation handled asynchronously via `cert-generation` SQS queue
- PDF stored in S3
- Certificate record updated with S3 URL
- Target: issued within 5 business days of eligibility confirmation
