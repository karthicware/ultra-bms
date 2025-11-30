package com.ultrabms.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cache configuration for the application.
 * Uses simple in-memory caching with ConcurrentMapCacheManager.
 */
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
            // Property caches
            "properties",
            "propertyById",
            "propertyWithOccupancy",
            // Company profile cache
            "companyProfile",
            // Financial dashboard cache
            "financialDashboard",
            // Login attempt tracking cache
            "loginAttemptsCache"
        );
    }
}
