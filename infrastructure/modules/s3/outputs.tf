output "assets_bucket_id" {
  description = "Static assets bucket ID"
  value       = aws_s3_bucket.assets.id
}

output "assets_bucket_arn" {
  description = "Static assets bucket ARN"
  value       = aws_s3_bucket.assets.arn
}

output "uploads_bucket_id" {
  description = "Learner uploads bucket ID"
  value       = aws_s3_bucket.uploads.id
}

output "backups_bucket_id" {
  description = "Backups bucket ID"
  value       = aws_s3_bucket.backups.id
}

output "certificates_bucket_id" {
  description = "Certificates bucket ID"
  value       = aws_s3_bucket.certificates.id
}
