package com.ultrabms.util;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Utility class for generating unique lead numbers
 * Format: LEAD-YYYYMMDD-XXXX (e.g., LEAD-20250115-0001)
 */
@Component
public class LeadNumberGenerator {

    private static final String PREFIX = "LEAD";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private final AtomicInteger sequence = new AtomicInteger(0);
    private String currentDate = "";

    /**
     * Generate next lead number
     */
    public synchronized String generate() {
        String dateStr = LocalDateTime.now().format(DATE_FORMATTER);

        // Reset sequence if date changed
        if (!dateStr.equals(currentDate)) {
            currentDate = dateStr;
            sequence.set(0);
        }

        int nextSeq = sequence.incrementAndGet();
        return String.format("%s-%s-%04d", PREFIX, dateStr, nextSeq);
    }
}
