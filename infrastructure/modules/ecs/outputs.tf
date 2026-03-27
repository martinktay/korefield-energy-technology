output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = aws_ecs_service.frontend.name
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = aws_ecs_service.backend.name
}

output "ai_services_service_name" {
  description = "AI services ECS service name"
  value       = aws_ecs_service.ai_services.name
}

output "workers_service_name" {
  description = "Workers ECS service name"
  value       = aws_ecs_service.workers.name
}
