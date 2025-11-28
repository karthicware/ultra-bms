package com.ultrabms.scheduler;

import com.ultrabms.service.InvoiceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job for invoice-related automation tasks.
 * Handles invoice generation, overdue marking, late fees, and payment reminders.
 *
 * Story 6.1: Rent Invoicing and Payment Management
 */
@Component
public class InvoiceSchedulerJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(InvoiceSchedulerJob.class);

    private final InvoiceService invoiceService;

    @Value("${invoice.reminder-days-before:7}")
    private int reminderDaysBefore;

    public InvoiceSchedulerJob(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    /**
     * Generate monthly invoices for active tenants (AC #3).
     * Runs on the 1st of every month at 1 AM.
     *
     * Creates invoices for tenants based on their lease agreements:
     * - Monthly rent amount
     * - Service charges
     * - Parking fees
     * - Any recurring additional charges
     */
    @Scheduled(cron = "${invoice.generation.cron:0 0 1 1 * *}")
    public void generateMonthlyInvoices() {
        LOGGER.info("Starting monthly invoice generation job");

        try {
            int generatedCount = invoiceService.generateScheduledInvoices();
            LOGGER.info("Monthly invoice generation completed: {} invoices generated", generatedCount);
        } catch (Exception e) {
            LOGGER.error("Monthly invoice generation job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Mark overdue invoices (AC #12).
     * Runs every day at 2 AM.
     *
     * Updates status of SENT or PARTIALLY_PAID invoices to OVERDUE
     * when current date is past due date.
     */
    @Scheduled(cron = "${invoice.overdue.cron:0 0 2 * * *}")
    public void markOverdueInvoices() {
        LOGGER.info("Starting overdue invoice marking job");

        try {
            int overdueCount = invoiceService.markOverdueInvoices();
            LOGGER.info("Overdue invoice marking completed: {} invoices marked as overdue", overdueCount);
        } catch (Exception e) {
            LOGGER.error("Overdue invoice marking job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Apply late fees to overdue invoices (AC #13).
     * Runs every day at 3 AM.
     *
     * Applies configurable late fee percentage to overdue invoices
     * that haven't already had late fees applied.
     */
    @Scheduled(cron = "${invoice.late-fee.cron:0 0 3 * * *}")
    public void applyLateFees() {
        LOGGER.info("Starting late fee application job");

        try {
            int lateFeeCount = invoiceService.applyLateFees();
            LOGGER.info("Late fee application completed: {} invoices had late fees applied", lateFeeCount);
        } catch (Exception e) {
            LOGGER.error("Late fee application job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send payment reminder emails (AC #14).
     * Runs every day at 9 AM.
     *
     * Sends email reminders for invoices due within configurable days.
     * Default is 7 days before due date.
     */
    @Scheduled(cron = "${invoice.reminder.cron:0 0 9 * * *}")
    public void sendPaymentReminders() {
        LOGGER.info("Starting payment reminder job");

        try {
            int reminderCount = invoiceService.sendPaymentReminders(reminderDaysBefore);
            LOGGER.info("Payment reminder job completed: {} reminders sent", reminderCount);
        } catch (Exception e) {
            LOGGER.error("Payment reminder job failed: {}", e.getMessage(), e);
        }
    }
}
