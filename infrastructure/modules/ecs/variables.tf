variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "project" {
  description = "Project name for resource tagging"
  type        = string
  default     = "korefield-academy"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "frontend_image" {
  description = "Docker image for frontend service"
  type        = string
}

variable "backend_image" {
  description = "Docker image for backend service"
  type        = string
}

variable "ai_services_image" {
  description = "Docker image for AI services"
  type        = string
}

variable "workers_image" {
  description = "Docker image for workers"
  type        = string
}

variable "frontend_cpu" {
  description = "CPU units for frontend task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MiB) for frontend task"
  type        = number
  default     = 512
}

variable "backend_cpu" {
  description = "CPU units for backend task"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory (MiB) for backend task"
  type        = number
  default     = 1024
}

variable "ai_services_cpu" {
  description = "CPU units for AI services task"
  type        = number
  default     = 1024
}

variable "ai_services_memory" {
  description = "Memory (MiB) for AI services task"
  type        = number
  default     = 2048
}

variable "workers_cpu" {
  description = "CPU units for workers task"
  type        = number
  default     = 256
}

variable "workers_memory" {
  description = "Memory (MiB) for workers task"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Default desired count for services"
  type        = number
  default     = 1
}

variable "min_capacity" {
  description = "Minimum autoscaling capacity"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum autoscaling capacity"
  type        = number
  default     = 4
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
