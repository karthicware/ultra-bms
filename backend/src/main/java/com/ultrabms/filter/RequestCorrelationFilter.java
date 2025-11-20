package com.ultrabms.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter that generates and manages correlation IDs for request tracing.
 *
 * <p>This filter performs the following operations for each HTTP request:</p>
 * <ul>
 *   <li>Generates a unique correlation ID (UUID) for the request</li>
 *   <li>Stores the correlation ID in MDC (Mapped Diagnostic Context) for logging</li>
 *   <li>Adds the correlation ID to the response headers as {@code X-Correlation-ID}</li>
 *   <li>Clears the MDC after request processing to prevent memory leaks</li>
 * </ul>
 *
 * <p>The correlation ID can be used to trace the request across logs, making
 * debugging and troubleshooting much easier. It's especially useful in production
 * environments where you need to correlate logs from different parts of the system.</p>
 *
 * <p>Usage in logs: Configure Logback to include {@code %X{correlationId}} in the
 * log pattern to automatically include the correlation ID in all log statements
 * during request processing.</p>
 *
 * @see org.slf4j.MDC
 */
public class RequestCorrelationFilter implements Filter {

    private static final Logger LOG = LoggerFactory.getLogger(RequestCorrelationFilter.class);
    private static final String CORRELATION_ID_KEY = "correlationId";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    /**
     * Processes each HTTP request and response to add correlation ID.
     *
     * @param request the servlet request
     * @param response the servlet response
     * @param chain the filter chain
     * @throws IOException if an I/O error occurs
     * @throws ServletException if a servlet error occurs
     */
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        try {
            // Generate unique correlation ID
            String correlationId = generateCorrelationId();

            // Store in MDC for logging (will be included in all log statements)
            MDC.put(CORRELATION_ID_KEY, correlationId);

            // Add to response headers for client-side tracking
            httpResponse.setHeader(CORRELATION_ID_HEADER, correlationId);

            LOG.debug("Request received: {} {} [correlationId={}]",
                    httpRequest.getMethod(),
                    httpRequest.getRequestURI(),
                    correlationId);

            // Continue with request processing
            chain.doFilter(request, response);

            LOG.debug("Request completed: {} {} [correlationId={}] [status={}]",
                    httpRequest.getMethod(),
                    httpRequest.getRequestURI(),
                    correlationId,
                    httpResponse.getStatus());

        } finally {
            // CRITICAL: Clear MDC after request to prevent memory leaks
            // and avoid correlation ID pollution across different requests
            // (especially important in thread pool environments)
            MDC.clear();
        }
    }

    /**
     * Generates a unique correlation ID using UUID.
     *
     * @return a UUID string for correlation ID
     */
    private String generateCorrelationId() {
        return UUID.randomUUID().toString();
    }
}
