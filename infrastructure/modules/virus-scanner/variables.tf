variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
}

variable "uploads_bucket_id" {
  description = "S3 bucket ID for content uploads"
  type        = string
}

variable "uploads_bucket_arn" {
  description = "S3 bucket ARN for content uploads"
  type        = string
}

variable "admin_alerts_queue_arn" {
  description = "SQS queue ARN for admin alert notifications"
  type        = string
  default     = ""
}
