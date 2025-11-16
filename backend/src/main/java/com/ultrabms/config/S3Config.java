package com.ultrabms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * AWS S3 Configuration
 * Configures S3 client for file storage operations
 */
@Configuration
public class S3Config {

    @Value("${aws.s3.region:me-central-1}")
    private String region;

    /**
     * Creates and configures S3 client bean
     * Uses DefaultCredentialsProvider which checks:
     * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
     * 2. System properties (aws.accessKeyId, aws.secretKey)
     * 3. AWS credentials file (~/.aws/credentials)
     * 4. EC2 instance profile credentials
     *
     * @return Configured S3Client
     */
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}
