output "queue_urls" {
  description = "Map of queue name to URL"
  value = {
    cert_generation  = aws_sqs_queue.cert_generation.url
    ai_workflow      = aws_sqs_queue.ai_workflow.url
    analytics        = aws_sqs_queue.analytics.url
    notifications    = aws_sqs_queue.notifications.url
    payment_events   = aws_sqs_queue.payment_events.url
  }
}

output "queue_arns" {
  description = "Map of queue name to ARN"
  value = {
    cert_generation  = aws_sqs_queue.cert_generation.arn
    ai_workflow      = aws_sqs_queue.ai_workflow.arn
    analytics        = aws_sqs_queue.analytics.arn
    notifications    = aws_sqs_queue.notifications.arn
    payment_events   = aws_sqs_queue.payment_events.arn
  }
}

output "dlq_arns" {
  description = "Map of DLQ name to ARN"
  value = {
    cert_generation  = aws_sqs_queue.cert_generation_dlq.arn
    ai_workflow      = aws_sqs_queue.ai_workflow_dlq.arn
    analytics        = aws_sqs_queue.analytics_dlq.arn
    notifications    = aws_sqs_queue.notifications_dlq.arn
    payment_events   = aws_sqs_queue.payment_events_dlq.arn
  }
}
