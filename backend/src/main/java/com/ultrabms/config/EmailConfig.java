package com.ultrabms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuration for email sending with asynchronous execution support.
 * Enables @Async annotation for non-blocking email operations.
 * Enables @Scheduled annotation for scheduled cleanup jobs.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class EmailConfig {

    /**
     * Configure thread pool for asynchronous email sending.
     * Ensures email operations don't block API response threads.
     *
     * <p>Pool configuration:
     * <ul>
     *   <li>Core pool size: 2 threads (handles typical email volume)</li>
     *   <li>Max pool size: 5 threads (handles bursts)</li>
     *   <li>Queue capacity: 100 (buffers peak loads)</li>
     *   <li>Thread name prefix: "email-" (for debugging)</li>
     * </ul></p>
     *
     * @return configured ThreadPoolTaskExecutor for async operations
     */
    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("email-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
}
