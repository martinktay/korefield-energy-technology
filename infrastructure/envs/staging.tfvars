# KoreField Academy — Staging Environment
# Identical definitions to dev/production, differing only in scale/config

environment = "staging"
project     = "korefield-academy"

# Tagging
tags = {
  Environment = "staging"
  Project     = "korefield-academy"
  CostCentre  = "engineering"
  Owner       = "platform-team"
}

# VPC
vpc_cidr             = "10.1.0.0/16"
availability_zones   = ["eu-west-1a", "eu-west-1b"]
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.10.0/24", "10.1.11.0/24"]
data_subnet_cidrs    = ["10.1.20.0/24", "10.1.21.0/24"]

# RDS
rds_instance_class        = "db.t3.medium"
rds_allocated_storage     = 50
rds_multi_az              = true
rds_backup_retention      = 7
rds_deletion_protection   = true

# Redis
redis_node_type       = "cache.t3.small"
redis_num_cache_nodes = 2

# ECS
frontend_cpu        = 512
frontend_memory     = 1024
backend_cpu         = 512
backend_memory      = 1024
ai_services_cpu     = 1024
ai_services_memory  = 2048
workers_cpu         = 256
workers_memory      = 512
ecs_desired_count   = 2
ecs_min_capacity    = 2
ecs_max_capacity    = 4

# Monitoring
log_retention_days = 30

# Secrets
secrets_rotation_days = 30

# Budget
budget_monthly_limit = "2000"
