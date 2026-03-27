# KoreField Academy — Dev Environment
# Identical definitions to staging/production, differing only in scale/config

environment = "dev"
project     = "korefield-academy"

# Tagging
tags = {
  Environment = "dev"
  Project     = "korefield-academy"
  CostCentre  = "engineering"
  Owner       = "platform-team"
}

# VPC
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["eu-west-1a", "eu-west-1b"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
data_subnet_cidrs    = ["10.0.20.0/24", "10.0.21.0/24"]

# RDS
rds_instance_class        = "db.t3.micro"
rds_allocated_storage     = 20
rds_multi_az              = false
rds_backup_retention      = 3
rds_deletion_protection   = false

# Redis
redis_node_type       = "cache.t3.micro"
redis_num_cache_nodes = 1

# ECS
frontend_cpu        = 256
frontend_memory     = 512
backend_cpu         = 256
backend_memory      = 512
ai_services_cpu     = 512
ai_services_memory  = 1024
workers_cpu         = 256
workers_memory      = 512
ecs_desired_count   = 1
ecs_min_capacity    = 1
ecs_max_capacity    = 2

# Monitoring
log_retention_days = 7

# Secrets
secrets_rotation_days = 90

# Budget
budget_monthly_limit = "500"
