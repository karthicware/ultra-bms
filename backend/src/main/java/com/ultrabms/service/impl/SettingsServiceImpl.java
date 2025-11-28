package com.ultrabms.service.impl;

import com.ultrabms.dto.settings.AppearanceSettingsRequest;
import com.ultrabms.dto.settings.AppearanceSettingsResponse;
import com.ultrabms.entity.User;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.SettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implementation of SettingsService for managing user settings.
 * Story 2.7: Admin Theme Settings & System Theme Support
 */
@Service
public class SettingsServiceImpl implements SettingsService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SettingsServiceImpl.class);

    private final UserRepository userRepository;

    public SettingsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AppearanceSettingsResponse getAppearanceSettings(UUID userId) {
        LOGGER.debug("Getting appearance settings for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        return AppearanceSettingsResponse.builder()
                .themePreference(user.getThemePreference())
                .build();
    }

    @Override
    @Transactional
    public AppearanceSettingsResponse updateAppearanceSettings(UUID userId, AppearanceSettingsRequest request) {
        LOGGER.debug("Updating appearance settings for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        user.setThemePreference(request.getThemePreference());
        userRepository.save(user);

        LOGGER.info("Updated theme preference to {} for user: {}", request.getThemePreference(), userId);

        return AppearanceSettingsResponse.builder()
                .themePreference(user.getThemePreference())
                .build();
    }
}
