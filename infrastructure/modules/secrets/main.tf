###############################################################################
# Secrets Manager — Credentials with automated rotation
###############################################################################

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
    Module      = "secrets"
  })
  prefix = "${var.project}-${var.environment}"
}

resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager — ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = merge(local.common_tags, { Name = "${local.prefix}-secrets-kms" })
}

# --- Database credentials ---

resource "aws_secretsmanager_secret" "db_credentials" {
  name       = "${local.prefix}/db-credentials"
  kms_key_id = aws_kms_key.secrets.arn
  tags       = merge(local.common_tags, { Name = "${local.prefix}-db-credentials", SecretType = "database" })
}

resource "aws_secretsmanager_secret_rotation" "db_credentials" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn = "" # Placeholder — rotation Lambda ARN to be configured

  rotation_rules {
    automatically_after_days = var.rotation_days
  }

  lifecycle {
    ignore_changes = [rotation_lambda_arn]
  }
}

# --- API keys (LLM providers, LangSmith, payment gateway) ---

resource "aws_secretsmanager_secret" "api_keys" {
  name       = "${local.prefix}/api-keys"
  kms_key_id = aws_kms_key.secrets.arn
  tags       = merge(local.common_tags, { Name = "${local.prefix}-api-keys", SecretType = "api-keys" })
}

resource "aws_secretsmanager_secret_rotation" "api_keys" {
  secret_id           = aws_secretsmanager_secret.api_keys.id
  rotation_lambda_arn = "" # Placeholder — rotation Lambda ARN to be configured

  rotation_rules {
    automatically_after_days = var.rotation_days
  }

  lifecycle {
    ignore_changes = [rotation_lambda_arn]
  }
}

# --- JWT signing secret ---

resource "aws_secretsmanager_secret" "jwt_secret" {
  name       = "${local.prefix}/jwt-secret"
  kms_key_id = aws_kms_key.secrets.arn
  tags       = merge(local.common_tags, { Name = "${local.prefix}-jwt-secret", SecretType = "jwt" })
}

resource "aws_secretsmanager_secret_rotation" "jwt_secret" {
  secret_id           = aws_secretsmanager_secret.jwt_secret.id
  rotation_lambda_arn = "" # Placeholder — rotation Lambda ARN to be configured

  rotation_rules {
    automatically_after_days = 90
  }

  lifecycle {
    ignore_changes = [rotation_lambda_arn]
  }
}
