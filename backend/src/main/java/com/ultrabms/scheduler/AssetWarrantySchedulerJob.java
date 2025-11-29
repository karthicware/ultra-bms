package com.ultrabms.scheduler;

import com.ultrabms.entity.Asset;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.UserRole;
import com.ultrabms.repository.AssetRepository;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.IEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Scheduled job for asset warranty expiry monitoring and notifications.
 * Sends 30-day and 7-day warranty expiry reminders to property managers.
 *
 * Story 7.1: Asset Registry and Tracking (AC #17)
 */
@Component
public class AssetWarrantySchedulerJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(AssetWarrantySchedulerJob.class);
    private static final int WARRANTY_ALERT_30_DAYS = 30;
    private static final int WARRANTY_ALERT_7_DAYS = 7;

    private final AssetRepository assetRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final IEmailService emailService;

    public AssetWarrantySchedulerJob(
            AssetRepository assetRepository,
            PropertyRepository propertyRepository,
            UserRepository userRepository,
            IEmailService emailService) {
        this.assetRepository = assetRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    /**
     * Send 30-day warranty expiry reminders.
     * Runs every day at 9 AM.
     *
     * Sends reminder to property managers for assets with warranties
     * expiring in approximately 30 days.
     */
    @Scheduled(cron = "${asset.warranty.reminder.30day.cron:0 0 9 * * *}")
    @Transactional(readOnly = true)
    public void send30DayReminders() {
        LOGGER.info("Starting 30-day warranty expiry reminder job");

        try {
            LocalDate today = LocalDate.now();
            LocalDate in30Days = today.plusDays(WARRANTY_ALERT_30_DAYS);
            LocalDate in29Days = today.plusDays(WARRANTY_ALERT_30_DAYS - 1);

            // Find assets with warranties expiring in 29-30 days
            List<Asset> assets = assetRepository.findAssetsWithExpiringWarranty(in29Days, in30Days);

            int sentCount = sendWarrantyReminders(assets, today);

            LOGGER.info("30-day warranty reminder job completed: {} reminders sent", sentCount);
        } catch (Exception e) {
            LOGGER.error("30-day warranty reminder job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send 7-day warranty expiry reminders (urgent).
     * Runs every day at 10 AM.
     *
     * Sends urgent reminder to property managers for assets with warranties
     * expiring in approximately 7 days.
     */
    @Scheduled(cron = "${asset.warranty.reminder.7day.cron:0 0 10 * * *}")
    @Transactional(readOnly = true)
    public void send7DayReminders() {
        LOGGER.info("Starting 7-day warranty expiry reminder job");

        try {
            LocalDate today = LocalDate.now();
            LocalDate in7Days = today.plusDays(WARRANTY_ALERT_7_DAYS);
            LocalDate in6Days = today.plusDays(WARRANTY_ALERT_7_DAYS - 1);

            // Find assets with warranties expiring in 6-7 days
            List<Asset> assets = assetRepository.findAssetsWithExpiringWarranty(in6Days, in7Days);

            int sentCount = sendWarrantyReminders(assets, today);

            LOGGER.info("7-day warranty reminder job completed: {} reminders sent", sentCount);
        } catch (Exception e) {
            LOGGER.error("7-day warranty reminder job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Send warranty reminders for a list of assets.
     *
     * @param assets List of assets with expiring warranties
     * @param today Current date for calculating days until expiry
     * @return Number of reminders sent
     */
    private int sendWarrantyReminders(List<Asset> assets, LocalDate today) {
        if (assets.isEmpty()) {
            return 0;
        }

        // Get property IDs for batch lookup
        List<UUID> propertyIds = assets.stream()
                .map(Asset::getPropertyId)
                .distinct()
                .toList();

        // Get properties and their managers
        Map<UUID, Property> propertyMap = propertyRepository.findAllById(propertyIds).stream()
                .collect(Collectors.toMap(Property::getId, p -> p));

        // Get admin/property manager users to notify
        List<User> managers = userRepository.findByRoleIn(List.of(UserRole.SUPER_ADMIN, UserRole.PROPERTY_MANAGER));

        int sentCount = 0;
        for (Asset asset : assets) {
            Property property = propertyMap.get(asset.getPropertyId());
            String propertyName = property != null ? property.getName() : "Unknown Property";

            int daysUntilExpiry = (int) ChronoUnit.DAYS.between(today, asset.getWarrantyExpiryDate());

            // Send to all admin/property managers
            // In a more sophisticated setup, you might filter by property assignment
            for (User manager : managers) {
                try {
                    emailService.sendWarrantyExpiryReminder(
                            manager.getEmail(),
                            manager.getFirstName() + " " + manager.getLastName(),
                            asset,
                            propertyName,
                            daysUntilExpiry
                    );
                    sentCount++;
                } catch (Exception e) {
                    LOGGER.error("Failed to send warranty reminder to {} for asset {}: {}",
                            manager.getEmail(), asset.getAssetNumber(), e.getMessage());
                }
            }
        }

        return sentCount;
    }
}
