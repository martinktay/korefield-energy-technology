output "quarantine_bucket_id" {
  description = "Quarantine S3 bucket ID"
  value       = aws_s3_bucket.quarantine.id
}

output "quarantine_bucket_arn" {
  description = "Quarantine S3 bucket ARN"
  value       = aws_s3_bucket.quarantine.arn
}

output "scanner_function_arn" {
  description = "Virus scanner Lambda function ARN"
  value       = aws_lambda_function.virus_scanner.arn
}

output "scanner_dlq_url" {
  description = "Dead-letter queue URL for scanner failures"
  value       = aws_sqs_queue.scanner_dlq.id
}
