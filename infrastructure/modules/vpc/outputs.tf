output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "data_subnet_ids" {
  description = "IDs of data tier subnets"
  value       = aws_subnet.data[*].id
}

output "nat_gateway_id" {
  description = "ID of the NAT gateway"
  value       = aws_nat_gateway.main.id
}

output "public_security_group_id" {
  description = "Security group for public-facing services"
  value       = aws_security_group.public.id
}

output "private_security_group_id" {
  description = "Security group for internal services"
  value       = aws_security_group.private.id
}

output "data_security_group_id" {
  description = "Security group for data stores"
  value       = aws_security_group.data.id
}
