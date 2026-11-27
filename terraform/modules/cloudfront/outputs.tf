output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_domain" {
  description = "CloudFront domain name (HTTPS URL)"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "distribution_url" {
  description = "Full HTTPS URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}
