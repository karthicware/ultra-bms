package com.ultrabms.config;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * AWS S3 Configuration
 * Configures S3 client and presigner for file storage operations.
 *
 * Supports LocalStack for local development:
 * - Set aws.s3.endpoint to http://localhost:4566 in application-dev.yml
 * - For production, leave endpoint empty to use real AWS S3
 */
@Configuration
public class S3Config {

    @Value("${aws.s3.region:me-central-1}")
    private String region;

    @Value("${aws.s3.endpoint:}")
    private String endpoint;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.access-key:}")
    private String accessKey;

    @Value("${aws.s3.secret-key:}")
    private String secretKey;

    /**
     * Creates and configures S3 client bean.
     *
     * Uses StaticCredentialsProvider if access-key and secret-key are provided,
     * otherwise falls back to DefaultCredentialsProvider which checks:
     * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
     * 2. System properties (aws.accessKeyId, aws.secretKey)
     * 3. AWS credentials file (~/.aws/credentials)
     * 4. EC2 instance profile credentials
     *
     * For LocalStack development, endpoint override is applied when
     * aws.s3.endpoint property is set.
     *
     * @return Configured S3Client
     */
    @Bean
    public S3Client s3Client() {
        var builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(getCredentialsProvider());

        // Apply endpoint override for LocalStack (dev environment)
        if (endpoint != null && !endpoint.isEmpty()) {
            builder.endpointOverride(URI.create(endpoint))
                    // Use path-style access for LocalStack (bucket in path, not subdomain)
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build());
        }

        return builder.build();
    }

    private AwsCredentialsProvider getCredentialsProvider() {
        if (accessKey != null && !accessKey.isEmpty() && secretKey != null && !secretKey.isEmpty()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        }
        return DefaultCredentialsProvider.create();
    }

    /**
     * Creates and configures S3 presigner bean for generating presigned URLs.
     *
     * Presigned URLs allow secure, temporary access to S3 objects without
     * requiring AWS credentials. Used for file downloads with 5-minute expiration.
     *
     * Must use same region and endpoint configuration as S3Client.
     *
     * @return Configured S3Presigner
     */
    @Bean
    public S3Presigner s3Presigner() {
        var builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(getCredentialsProvider());

        // Apply endpoint override for LocalStack (dev environment)
        if (endpoint != null && !endpoint.isEmpty()) {
            builder.endpointOverride(URI.create(endpoint))
                    // Use path-style access for LocalStack (bucket in path, not subdomain)
                    .serviceConfiguration(S3Configuration.builder()
                            .pathStyleAccessEnabled(true)
                            .build());
        }

        return builder.build();
    }
}
