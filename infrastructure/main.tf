###############################################################################
# KoreField Academy — Root Terraform Configuration
# Composes all infrastructure modules for a given environment.
# Usage: terraform init && terraform plan -var-file=envs/dev.tfvars
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote backend — uncomment and configure for team use
  # backend "s3" {
  #   bucket         = "korefield-terraform-state"
  #   key            = "infrastructure/terraform.tfstate"
  #   region         = "eu-west-1"
  #   dynamodb_table = "korefield-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Variables ────────────────────────────────────────────────────

variable "aws_region" {
  type    = string
  default = "eu-west-1"
}

variable "environment" { type = string }
variable "project" { type = string }
variable "tags" { type = map(string) }

# VPC variables
variable "vpc_cidr" { type = string }
variable "availability_zones" { type = list(string) }
variable "public_subnet_cidrs" { type = list(string) }
variable "private_subnet_cidrs" { type = list(string) }
variable "data_subnet_cidrs" { type = list(string) }

# RDS variables
variable "rds_instance_class" { type = string }
variable "rds_allocated_storage" { type = number }
variable "rds_multi_az" { type = bool }
variable "rds_backup_retention" { type = number }
variable "rds_deletion_protection" { type = bool }

# Redis variables
variable "redis_node_type" { type = string }
variable "redis_num_cache_nodes" { type = number }

# ECS variables
variable "frontend_cpu" { type = number }
variable "frontend_memory" { type = number }
variable "backend_cpu" { type = number }
variable "backend_memory" { type = number }
variable "ai_services_cpu" { type = number }
variable "ai_services_memory" { type = number }
variable "workers_cpu" { type = number }
variable "workers_memory" { type = number }
variable "ecs_desired_count" { type = number }
variable "ecs_min_capacity" { type = number }
variable "ecs_max_capacity" { type = number }

# Monitoring
variable "log_retention_days" { type = number }

# Secrets
variable "secrets_rotation_days" { type = number }

# Budget
variable "budget_monthly_limit" { type = string }

# ECS container images (ECR URI pattern)
variable "frontend_image" {
  description = "Docker image URI for frontend service"
  type        = string
  default     = "korefield-academy-frontend:latest"
}

variable "backend_image" {
  description = "Docker image URI for backend service"
  type        = string
  default     = "korefield-academy-backend:latest"
}

variable "ai_services_image" {
  description = "Docker image URI for AI services"
  type        = string
  default     = "korefield-academy-ai-services:latest"
}

variable "workers_image" {
  description = "Docker image URI for workers"
  type        = string
  default     = "korefield-academy-workers:latest"
}

# ── VPC Module ───────────────────────────────────────────────────

module "vpc" {
  source = "./modules/vpc"

  environment          = var.environment
  project              = var.project
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  data_subnet_cidrs    = var.data_subnet_cidrs
  tags                 = var.tags
}

# ── RDS Module ───────────────────────────────────────────────────

module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  project                 = var.project
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.data_subnet_ids
  security_group_id       = module.vpc.data_security_group_id
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  multi_az                = var.rds_multi_az
  backup_retention_period = var.rds_backup_retention
  deletion_protection     = var.rds_deletion_protection
  tags                    = var.tags
}

# ── Redis Module ─────────────────────────────────────────────────

module "redis" {
  source = "./modules/redis"

  environment       = var.environment
  project           = var.project
  subnet_ids        = module.vpc.data_subnet_ids
  security_group_id = module.vpc.data_security_group_id
  node_type         = var.redis_node_type
  num_cache_nodes   = var.redis_num_cache_nodes
  tags              = var.tags
}

# ── SQS Module ───────────────────────────────────────────────────

module "sqs" {
  source = "./modules/sqs"

  environment = var.environment
  project     = var.project
  tags        = var.tags
}

# ── S3 Module ────────────────────────────────────────────────────

module "s3" {
  source = "./modules/s3"

  environment = var.environment
  project     = var.project
  tags        = var.tags
}

# ── Secrets Module ───────────────────────────────────────────────

module "secrets" {
  source = "./modules/secrets"

  environment   = var.environment
  project       = var.project
  rotation_days = var.secrets_rotation_days
  tags          = var.tags
}

# ── ECS Module ───────────────────────────────────────────────────

module "ecs" {
  source = "./modules/ecs"

  environment        = var.environment
  project            = var.project
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.vpc.private_security_group_id
  frontend_image     = var.frontend_image
  backend_image      = var.backend_image
  ai_services_image  = var.ai_services_image
  workers_image      = var.workers_image
  frontend_cpu       = var.frontend_cpu
  frontend_memory    = var.frontend_memory
  backend_cpu        = var.backend_cpu
  backend_memory     = var.backend_memory
  ai_services_cpu    = var.ai_services_cpu
  ai_services_memory = var.ai_services_memory
  workers_cpu        = var.workers_cpu
  workers_memory     = var.workers_memory
  desired_count      = var.ecs_desired_count
  min_capacity       = var.ecs_min_capacity
  max_capacity       = var.ecs_max_capacity
  tags               = var.tags
}

# ── Monitoring Module ────────────────────────────────────────────

module "monitoring" {
  source = "./modules/monitoring"

  environment      = var.environment
  project          = var.project
  log_retention_days = var.log_retention_days
  ecs_cluster_name = module.ecs.cluster_name
  tags             = var.tags
}

# ── Virus Scanner Module ─────────────────────────────────────────

module "virus_scanner" {
  source = "./modules/virus-scanner"

  environment            = var.environment
  project                = var.project
  uploads_bucket_id      = module.s3.uploads_bucket_id
  uploads_bucket_arn     = module.s3.uploads_bucket_arn
  admin_alerts_queue_arn = module.sqs.queue_arns["notifications"]
  tags                   = var.tags
}

# ── Outputs ──────────────────────────────────────────────────────

# VPC
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# RDS
output "rds_endpoint" {
  description = "RDS instance endpoint for DATABASE_URL"
  value       = module.rds.endpoint
}

output "rds_db_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

# Redis
output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.redis.redis_endpoint
}

output "redis_port" {
  description = "Redis port"
  value       = module.redis.redis_port
}

# SQS
output "sqs_queue_urls" {
  description = "Map of SQS queue name to URL"
  value       = module.sqs.queue_urls
}

output "sqs_queue_arns" {
  description = "Map of SQS queue name to ARN"
  value       = module.sqs.queue_arns
}

# S3
output "s3_assets_bucket_id" {
  description = "Static assets S3 bucket ID"
  value       = module.s3.assets_bucket_id
}

output "s3_uploads_bucket_id" {
  description = "Learner uploads S3 bucket ID"
  value       = module.s3.uploads_bucket_id
}

output "s3_uploads_bucket_arn" {
  description = "Learner uploads S3 bucket ARN"
  value       = module.s3.uploads_bucket_arn
}

output "s3_backups_bucket_id" {
  description = "Backups S3 bucket ID"
  value       = module.s3.backups_bucket_id
}

output "s3_certificates_bucket_id" {
  description = "Certificates S3 bucket ID"
  value       = module.s3.certificates_bucket_id
}

# ECS
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_frontend_service_name" {
  description = "Frontend ECS service name"
  value       = module.ecs.frontend_service_name
}

output "ecs_backend_service_name" {
  description = "Backend ECS service name"
  value       = module.ecs.backend_service_name
}

output "ecs_ai_services_service_name" {
  description = "AI services ECS service name"
  value       = module.ecs.ai_services_service_name
}

output "ecs_workers_service_name" {
  description = "Workers ECS service name"
  value       = module.ecs.workers_service_name
}

# Secrets
output "secrets_db_credentials_arn" {
  description = "ARN of the database credentials secret"
  value       = module.secrets.db_credentials_arn
}

output "secrets_api_keys_arn" {
  description = "ARN of the API keys secret"
  value       = module.secrets.api_keys_arn
}

output "secrets_jwt_secret_arn" {
  description = "ARN of the JWT secret"
  value       = module.secrets.jwt_secret_arn
}

output "secrets_ses_credentials_arn" {
  description = "ARN of the SES credentials secret"
  value       = module.secrets.ses_credentials_arn
}

output "secrets_kms_key_arn" {
  description = "ARN of the KMS key for secrets encryption"
  value       = module.secrets.kms_key_arn
}

# Monitoring
output "monitoring_log_group_names" {
  description = "Map of service to CloudWatch log group name"
  value       = module.monitoring.log_group_names
}

output "monitoring_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = module.monitoring.dashboard_name
}

# Virus Scanner
output "virus_scanner_lambda_arn" {
  description = "Virus scanner Lambda function ARN"
  value       = module.virus_scanner.lambda_function_arn
}

output "virus_scanner_quarantine_bucket_id" {
  description = "Quarantine S3 bucket ID"
  value       = module.virus_scanner.quarantine_bucket_id
}
