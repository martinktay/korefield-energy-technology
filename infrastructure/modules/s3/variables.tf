variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "project" {
  description = "Project name for resource tagging"
  type        = string
  default     = "korefield-academy"
}

variable "backup_region" {
  description = "AWS region for cross-region backup replication"
  type        = string
  default     = "eu-west-2"
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
