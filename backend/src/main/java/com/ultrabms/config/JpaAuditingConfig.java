package com.ultrabms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA Auditing configuration.
 * Enables automatic population of audit fields (createdAt, updatedAt) in entities.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {

    /**
     * Provides the current auditor (user ID) for audit fields.
     * Currently returns empty as authentication is not yet implemented.
     * Will be updated in Epic 2 to return the authenticated user's ID.
     *
     * @return AuditorAware bean that returns Optional.empty() until authentication is implemented
     */
    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> Optional.empty();
        // TODO Epic 2: Update to return SecurityContextHolder.getContext().getAuthentication()
        //              and extract user ID from authenticated principal
    }
}
