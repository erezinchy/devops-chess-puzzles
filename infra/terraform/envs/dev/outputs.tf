output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "rds_endpoint" {
  value     = module.rds.db_endpoint
  sensitive = true
}

output "cloudfront_domain" {
  value = module.s3_cloudfront.cloudfront_domain
}

output "s3_bucket_name" {
  value = module.s3_cloudfront.bucket_name
}

output "api_gateway_url" {
  value = module.api_gateway.api_url
}
