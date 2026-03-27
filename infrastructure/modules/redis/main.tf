###############################################################################
# ElastiCache Redis — Encryption at rest and in transit
###############################################################################

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
    Module      = "redis"
  })
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project}-${var.environment}-redis-subnet"
  subnet_ids = var.subnet_ids
  tags       = local.common_tags
}

resource "aws_kms_key" "redis" {
  description             = "KMS key for Redis encryption — ${var.environment}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = merge(local.common_tags, { Name = "${var.project}-${var.environment}-redis-kms" })
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project}-${var.environment}"
  description          = "KoreField Academy Redis — ${var.environment}"

  engine         = "redis"
  engine_version = var.engine_version
  node_type      = var.node_type
  num_cache_clusters = var.num_cache_nodes

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.security_group_id]

  # Encryption at rest
  at_rest_encryption_enabled = true
  kms_key_id                 = aws_kms_key.redis.arn

  # Encryption in transit
  transit_encryption_enabled = true

  # Maintenance
  maintenance_window       = "sun:05:00-sun:06:00"
  snapshot_retention_limit = 3
  snapshot_window          = "03:00-04:00"

  automatic_failover_enabled = var.num_cache_nodes > 1

  tags = merge(local.common_tags, { Name = "${var.project}-${var.environment}-redis" })
}
