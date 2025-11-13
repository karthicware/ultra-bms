package com.ultrabms.config;

import com.ultrabms.filter.RequestCorrelationFilter;
import com.ultrabms.filter.RequestResponseLoggingFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * Configuration for registering servlet filters.
 *
 * <p>This configuration class registers custom filters using
 * {@link FilterRegistrationBean} instead of {@code @Component} annotation
 * to have fine-grained control over filter ordering and URL patterns.</p>
 *
 * <p>Filter execution order:</p>
 * <ol>
 *   <li>RequestCorrelationFilter (HIGHEST_PRECEDENCE) - Generates correlation ID</li>
 *   <li>RequestResponseLoggingFilter (HIGHEST_PRECEDENCE + 1) - Logs requests/responses</li>
 * </ol>
 *
 * @see RequestCorrelationFilter
 * @see RequestResponseLoggingFilter
 */
@Configuration
public class FilterConfig {

    /**
     * Registers the RequestCorrelationFilter for all API requests.
     *
     * <p>This filter is set to highest precedence (HIGHEST_PRECEDENCE) to ensure
     * it runs before all other filters, so the correlation ID is available
     * throughout the entire request processing chain.</p>
     *
     * @return FilterRegistrationBean for RequestCorrelationFilter
     */
    @Bean
    public FilterRegistrationBean<RequestCorrelationFilter> correlationFilter() {
        FilterRegistrationBean<RequestCorrelationFilter> registrationBean = new FilterRegistrationBean<>();

        registrationBean.setFilter(new RequestCorrelationFilter());
        registrationBean.addUrlPatterns("/api/*"); // Apply to all API endpoints
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE); // Run first
        registrationBean.setName("requestCorrelationFilter");

        return registrationBean;
    }

    /**
     * Registers the RequestResponseLoggingFilter for all API requests.
     *
     * <p>This filter runs after the correlation filter (HIGHEST_PRECEDENCE + 1)
     * to ensure correlation IDs are available in the logs.</p>
     *
     * @return FilterRegistrationBean for RequestResponseLoggingFilter
     */
    @Bean
    public FilterRegistrationBean<RequestResponseLoggingFilter> loggingFilter() {
        FilterRegistrationBean<RequestResponseLoggingFilter> registrationBean = new FilterRegistrationBean<>();

        registrationBean.setFilter(new RequestResponseLoggingFilter());
        registrationBean.addUrlPatterns("/api/*"); // Apply to all API endpoints
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE + 1); // Run after correlation filter
        registrationBean.setName("requestResponseLoggingFilter");

        return registrationBean;
    }
}
