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

# ── Outputs ──────────────────────────────────────────────────────

output "rds_endpoint" {
  description = "RDS instance endpoint for DATABASE_URL"
  value       = module.rds.endpoint
}

output "rds_db_name" {
  description = "RDS database name"
  value       = "korefield_academy"
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}
