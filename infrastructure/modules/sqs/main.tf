###############################################################################
# SQS — 5 queues + 5 DLQs, encrypted at rest
###############################################################################

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
    Module      = "sqs"
  })
  prefix = "${var.project}-${var.environment}"
}

resource "aws_kms_key" "sqs" {
  description             = "KMS key for SQS encryption — ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = merge(local.common_tags, { Name = "${local.prefix}-sqs-kms" })
}

# --- cert-generation ---

resource "aws_sqs_queue" "cert_generation_dlq" {
  name                      = "${local.prefix}-cert-generation-dlq"
  message_retention_seconds = 1209600 # 14 days
  kms_master_key_id         = aws_kms_key.sqs.id
  tags                      = merge(local.common_tags, { Name = "${local.prefix}-cert-generation-dlq", Queue = "cert-generation-dlq" })
}

resource "aws_sqs_queue" "cert_generation" {
  name                       = "${local.prefix}-cert-generation"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id          = aws_kms_key.sqs.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.cert_generation_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(local.common_tags, { Name = "${local.prefix}-cert-generation", Queue = "cert-generation" })
}

# --- ai-workflow ---

resource "aws_sqs_queue" "ai_workflow_dlq" {
  name                      = "${local.prefix}-ai-workflow-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.sqs.id
  tags                      = merge(local.common_tags, { Name = "${local.prefix}-ai-workflow-dlq", Queue = "ai-workflow-dlq" })
}

resource "aws_sqs_queue" "ai_workflow" {
  name                       = "${local.prefix}-ai-workflow"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id          = aws_kms_key.sqs.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ai_workflow_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(local.common_tags, { Name = "${local.prefix}-ai-workflow", Queue = "ai-workflow" })
}


# --- analytics ---

resource "aws_sqs_queue" "analytics_dlq" {
  name                      = "${local.prefix}-analytics-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.sqs.id
  tags                      = merge(local.common_tags, { Name = "${local.prefix}-analytics-dlq", Queue = "analytics-dlq" })
}

resource "aws_sqs_queue" "analytics" {
  name                       = "${local.prefix}-analytics"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id          = aws_kms_key.sqs.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.analytics_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(local.common_tags, { Name = "${local.prefix}-analytics", Queue = "analytics" })
}

# --- notifications ---

resource "aws_sqs_queue" "notifications_dlq" {
  name                      = "${local.prefix}-notifications-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.sqs.id
  tags                      = merge(local.common_tags, { Name = "${local.prefix}-notifications-dlq", Queue = "notifications-dlq" })
}

resource "aws_sqs_queue" "notifications" {
  name                       = "${local.prefix}-notifications"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id          = aws_kms_key.sqs.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notifications_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(local.common_tags, { Name = "${local.prefix}-notifications", Queue = "notifications" })
}

# --- payment-events ---

resource "aws_sqs_queue" "payment_events_dlq" {
  name                      = "${local.prefix}-payment-events-dlq"
  message_retention_seconds = 1209600
  kms_master_key_id         = aws_kms_key.sqs.id
  tags                      = merge(local.common_tags, { Name = "${local.prefix}-payment-events-dlq", Queue = "payment-events-dlq" })
}

resource "aws_sqs_queue" "payment_events" {
  name                       = "${local.prefix}-payment-events"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  kms_master_key_id          = aws_kms_key.sqs.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_events_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = merge(local.common_tags, { Name = "${local.prefix}-payment-events", Queue = "payment-events" })
}
