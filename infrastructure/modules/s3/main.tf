###############################################################################
# S3 — Buckets for assets, uploads, backups, certificates
###############################################################################

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
    Module      = "s3"
  })

  buckets = {
    assets       = "${var.project}-${var.environment}-assets"
    uploads      = "${var.project}-${var.environment}-uploads"
    backups      = "${var.project}-${var.environment}-backups"
    certificates = "${var.project}-${var.environment}-certificates"
  }
}

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 encryption — ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = merge(local.common_tags, { Name = "${var.project}-${var.environment}-s3-kms" })
}

# --- Static assets bucket ---

resource "aws_s3_bucket" "assets" {
  bucket = local.buckets.assets
  tags   = merge(local.common_tags, { Name = local.buckets.assets, Purpose = "static-assets" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Learner uploads bucket ---

resource "aws_s3_bucket" "uploads" {
  bucket = local.buckets.uploads
  tags   = merge(local.common_tags, { Name = local.buckets.uploads, Purpose = "learner-uploads" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}


resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    id     = "archive-old-uploads"
    status = "Enabled"
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# --- Backups bucket ---

resource "aws_s3_bucket" "backups" {
  bucket = local.buckets.backups
  tags   = merge(local.common_tags, { Name = local.buckets.backups, Purpose = "backups" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration { status = "Enabled" }
}

# --- Certificates bucket ---

resource "aws_s3_bucket" "certificates" {
  bucket = local.buckets.certificates
  tags   = merge(local.common_tags, { Name = local.buckets.certificates, Purpose = "certificates" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "certificates" {
  bucket = aws_s3_bucket.certificates.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "certificates" {
  bucket                  = aws_s3_bucket.certificates.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
