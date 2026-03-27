# KoreField Academy — Production Environment
# Identical definitions to dev/staging, differing only in scale/config

environment = "production"
project     = "korefield-academy"

# Tagging
tags = {
  Environment = "production"
  Project     = "korefield-academy"
  CostCentre  = "operations"
  Owner       = "platform-team"
}

# VPC
vpc_cidr             = "10.2.0.0/16"
availability_zones   = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
data_subnet_cidrs    = ["10.2.20.0/24", "10.2.21.0/24", "10.2.22.0/24"]

# RDS
rds_instance_class        = "db.r6g.large"
rds_allocated_storage     = 100
rds_multi_az              = true
rds_backup_retention      = 30
rds_deletion_protection   = true

# Redis
redis_node_type       = "cache.r6g.large"
redis_num_cache_nodes = 3

# ECS
frontend_cpu        = 1024
frontend_memory     = 2048
backend_cpu         = 1024
backend_memory      = 2048
ai_services_cpu     = 2048
ai_services_memory  = 4096
workers_cpu         = 512
workers_memory      = 1024
ecs_desired_count   = 3
ecs_min_capacity    = 3
ecs_max_capacity    = 10

# Monitoring
log_retention_days = 90

# Secrets
secrets_rotation_days = 30

# Budget
budget_monthly_limit = "10000"
