###############################################################################
# CloudWatch — Logs, metrics, alarms, dashboards
###############################################################################

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
    Module      = "monitoring"
  })
  prefix = "${var.project}-${var.environment}"
}

# --- Log groups (structured logging: timestamp, service, trace ID, level, message) ---

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${local.prefix}/frontend"
  retention_in_days = var.log_retention_days
  tags              = merge(local.common_tags, { Service = "frontend" })
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.prefix}/backend"
  retention_in_days = var.log_retention_days
  tags              = merge(local.common_tags, { Service = "backend" })
}

resource "aws_cloudwatch_log_group" "ai_services" {
  name              = "/ecs/${local.prefix}/ai-services"
  retention_in_days = var.log_retention_days
  tags              = merge(local.common_tags, { Service = "ai-services" })
}

resource "aws_cloudwatch_log_group" "workers" {
  name              = "/ecs/${local.prefix}/workers"
  retention_in_days = var.log_retention_days
  tags              = merge(local.common_tags, { Service = "workers" })
}

# --- Alarms ---

resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "${local.prefix}-api-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API 5XX error rate exceeds threshold"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  tags                = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${local.prefix}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization exceeds 80%"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "${local.prefix}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS memory utilization exceeds 80%"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  tags = local.common_tags
}


# --- Dashboard ---

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.prefix}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS CPU Utilization"
          metrics = [["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name]]
          period  = 300
          stat    = "Average"
          region  = "eu-west-1"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS Memory Utilization"
          metrics = [["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name]]
          period  = 300
          stat    = "Average"
          region  = "eu-west-1"
        }
      }
    ]
  })
}
