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

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * Filter that logs incoming HTTP requests and outgoing responses.
 *
 * <p>This filter captures detailed information about each API request including:</p>
 * <ul>
 *   <li>HTTP method and URI</li>
 *   <li>Query parameters</li>
 *   <li>Request headers (excluding sensitive ones like Authorization)</li>
 *   <li>Response status code</li>
 *   <li>Request execution time</li>
 * </ul>
 *
 * <p>Sensitive headers (Authorization, Cookie, etc.) are masked to prevent
 * accidental logging of credentials or tokens.</p>
 *
 * <p>Log levels:</p>
 * <ul>
 *   <li>INFO: Basic request/response info (method, URI, status, duration)</li>
 *   <li>DEBUG: Detailed info including headers and query params</li>
 * </ul>
 */
public class RequestResponseLoggingFilter implements Filter {

    private static final Logger LOG = LoggerFactory.getLogger(RequestResponseLoggingFilter.class);

    private static final String[] SENSITIVE_HEADERS = {
            "authorization",
            "cookie",
            "set-cookie",
            "x-auth-token",
            "x-api-key"
    };

    /**
     * Logs request and response details.
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

        long startTime = System.currentTimeMillis();

        // Log request
        logRequest(httpRequest);

        // Continue with request processing
        chain.doFilter(request, response);

        // Log response
        long duration = System.currentTimeMillis() - startTime;
        logResponse(httpRequest, httpResponse, duration);
    }

    /**
     * Logs incoming request details.
     *
     * @param request the HTTP request
     */
    private void logRequest(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String queryString = request.getQueryString();

        // INFO level: Basic request info
        if (queryString != null) {
            log.info("→ {} {} ? {}", method, uri, queryString);
        } else {
            log.info("→ {} {}", method, uri);
        }

        // DEBUG level: Detailed info (headers, params)
        if (log.isDebugEnabled()) {
            Map<String, String> headers = getHeaders(request);
            log.debug("  Headers: {}", headers);

            if (request.getParameterMap() != null && !request.getParameterMap().isEmpty()) {
                log.debug("  Query Params: {}", request.getParameterMap());
            }
        }
    }

    /**
     * Logs outgoing response details.
     *
     * @param request the HTTP request
     * @param response the HTTP response
     * @param duration request execution time in milliseconds
     */
    private void logResponse(HttpServletRequest request, HttpServletResponse response, long duration) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        int status = response.getStatus();

        // INFO level: Response status and duration
        log.info("← {} {} → {} ({}ms)", method, uri, status, duration);

        // WARN level: Slow requests (>2 seconds)
        if (duration > 2000) {
            log.warn("SLOW REQUEST: {} {} took {}ms", method, uri, duration);
        }

        // WARN level: Client errors (4xx)
        if (status >= 400 && status < 500) {
            log.warn("CLIENT ERROR: {} {} → {}", method, uri, status);
        }

        // ERROR level: Server errors (5xx)
        if (status >= 500) {
            log.error("SERVER ERROR: {} {} → {}", method, uri, status);
        }
    }

    /**
     * Extracts request headers, masking sensitive ones.
     *
     * @param request the HTTP request
     * @return map of header names to values (sensitive ones masked)
     */
    private Map<String, String> getHeaders(HttpServletRequest request) {
        Map<String, String> headers = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();

        if (headerNames != null) {
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                String headerValue = request.getHeader(headerName);

                // Mask sensitive headers
                if (isSensitiveHeader(headerName)) {
                    headers.put(headerName, "***MASKED***");
                } else {
                    headers.put(headerName, headerValue);
                }
            }
        }

        return headers;
    }

    /**
     * Checks if a header is sensitive and should be masked.
     *
     * @param headerName the header name to check
     * @return true if the header is sensitive
     */
    private boolean isSensitiveHeader(String headerName) {
        if (headerName == null) {
            return false;
        }

        String lowerHeaderName = headerName.toLowerCase();
        for (String sensitiveHeader : SENSITIVE_HEADERS) {
            if (lowerHeaderName.contains(sensitiveHeader)) {
                return true;
            }
        }
        return false;
    }
}
