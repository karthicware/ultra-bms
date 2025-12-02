package com.ultrabms.config;

import org.springframework.context.annotation.Configuration;

/**
 * Cache configuration for the application.
 * Uses JCache/Ehcache via application.properties:
 *   spring.cache.type=jcache
 *   spring.cache.jcache.config=classpath:ehcache.xml
 *
 * All cache definitions are in ehcache.xml.
 * Do NOT define a CacheManager bean here - it overrides ehcache config.
 */
@Configuration
public class CacheConfig {
    // Ehcache configured via application.properties and ehcache.xml
}
