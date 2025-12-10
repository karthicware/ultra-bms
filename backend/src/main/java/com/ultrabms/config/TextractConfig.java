package com.ultrabms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.textract.TextractClient;

/**
 * AWS Textract Configuration
 * Configures Textract client for cheque OCR processing.
 *
 * SCP-2025-12-10: Added for cheque text extraction in tenant onboarding
 *
 * Note: Textract is not available in all AWS regions. Using ap-south-1 (Mumbai)
 * as it's the closest region to UAE that supports Textract.
 */
@Configuration
public class TextractConfig {

    // Textract uses a different region than S3 (Mumbai instead of UAE)
    @Value("${aws.textract.region:ap-south-1}")
    private String textractRegion;

    @Value("${aws.s3.access-key:}")
    private String accessKey;

    @Value("${aws.s3.secret-key:}")
    private String secretKey;

    /**
     * Creates and configures Textract client bean.
     *
     * Uses the same credentials as S3 but different region (ap-south-1 Mumbai)
     * since Textract is not available in UAE regions.
     *
     * @return Configured TextractClient
     */
    @Bean
    public TextractClient textractClient() {
        return TextractClient.builder()
                .region(Region.of(textractRegion))
                .credentialsProvider(getCredentialsProvider())
                .build();
    }

    private AwsCredentialsProvider getCredentialsProvider() {
        if (accessKey != null && !accessKey.isEmpty() && secretKey != null && !secretKey.isEmpty()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        }
        return DefaultCredentialsProvider.create();
    }
}
