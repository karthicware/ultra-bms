#!/bin/bash

echo "===================="
echo "LocalStack S3 Init Script"
echo "===================="

# Create S3 bucket for Ultra BMS development
echo "Creating S3 bucket: ultrabms-dev-storage"
awslocal s3 mb s3://ultrabms-dev-storage --region me-central-1

# Verify bucket creation
echo "Verifying bucket creation..."
awslocal s3 ls

echo "===================="
echo "S3 bucket created successfully!"
echo "Bucket: ultrabms-dev-storage"
echo "Region: me-central-1"
echo "Endpoint: http://localhost:4566"
echo "===================="
