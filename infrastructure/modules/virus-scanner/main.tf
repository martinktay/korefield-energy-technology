# Virus Scanner — S3 upload scanning via Lambda + ClamAV
# Triggers on s3:ObjectCreated:* for the uploads bucket.
# Clean files are tagged scan-status:clean; infected files are
# quarantined and an SQS notification is published.

resource "aws_s3_bucket" "quarantine" {
  bucket = "korefield-academy-${var.environment}-quarantine"
  tags   = { Environment = var.environment, Purpose = "virus-quarantine" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "quarantine_enc" {
  bucket = aws_s3_bucket.quarantine.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}

resource "aws_s3_bucket_public_access_block" "quarantine_block" {
  bucket                  = aws_s3_bucket.quarantine.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Dead-letter queue for scanner failures
resource "aws_sqs_queue" "scanner_dlq" {
  name                      = "korefield-${var.environment}-virus-scanner-dlq"
  message_retention_seconds = 1209600 # 14 days
  tags                      = { Environment = var.environment }
}

# IAM role for the Lambda function
resource "aws_iam_role" "scanner_role" {
  name = "korefield-${var.environment}-virus-scanner-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "scanner_policy" {
  name = "virus-scanner-policy"
  role = aws_iam_role.scanner_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObjectTagging", "s3:DeleteObject"]
        Resource = "${var.uploads_bucket_arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${aws_s3_bucket.quarantine.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = [aws_sqs_queue.scanner_dlq.arn, var.admin_alerts_queue_arn]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda function
resource "aws_lambda_function" "virus_scanner" {
  function_name = "korefield-${var.environment}-virus-scanner"
  role          = aws_iam_role.scanner_role.arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 1024
  filename      = "${path.module}/../../../lambda/virus-scanner/handler.zip"

  environment {
    variables = {
      QUARANTINE_BUCKET = aws_s3_bucket.quarantine.id
      DLQ_URL           = aws_sqs_queue.scanner_dlq.id
      ADMIN_QUEUE_URL   = var.admin_alerts_queue_arn != "" ? var.admin_alerts_queue_arn : ""
      ENVIRONMENT       = var.environment
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.scanner_dlq.arn
  }

  tags = { Environment = var.environment }
}

# S3 event notification → Lambda
resource "aws_lambda_permission" "s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.virus_scanner.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.uploads_bucket_arn
}

resource "aws_s3_bucket_notification" "uploads_notification" {
  bucket = var.uploads_bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.virus_scanner.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.s3_invoke]
}
