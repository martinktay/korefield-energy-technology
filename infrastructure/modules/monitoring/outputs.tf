output "log_group_names" {
  description = "Map of service to CloudWatch log group name"
  value = {
    frontend    = aws_cloudwatch_log_group.frontend.name
    backend     = aws_cloudwatch_log_group.backend.name
    ai_services = aws_cloudwatch_log_group.ai_services.name
    workers     = aws_cloudwatch_log_group.workers.name
  }
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "alarm_arns" {
  description = "Map of alarm name to ARN"
  value = {
    api_error_rate = aws_cloudwatch_metric_alarm.api_error_rate.arn
    cpu_high       = aws_cloudwatch_metric_alarm.cpu_high.arn
    memory_high    = aws_cloudwatch_metric_alarm.memory_high.arn
  }
}
