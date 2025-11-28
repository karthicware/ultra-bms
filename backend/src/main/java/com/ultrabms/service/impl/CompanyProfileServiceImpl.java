package com.ultrabms.service.impl;

import com.ultrabms.dto.settings.CompanyProfileLogoResponse;
import com.ultrabms.dto.settings.CompanyProfileRequest;
import com.ultrabms.dto.settings.CompanyProfileResponse;
import com.ultrabms.entity.CompanyProfile;
import com.ultrabms.entity.User;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.CompanyProfileRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.CompanyProfileService;
import com.ultrabms.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of CompanyProfileService for managing company profile.
 * Uses Ehcache for caching frequently accessed profile data.
 *
 * Story 2.8: Company Profile Settings
 */
@Service
public class CompanyProfileServiceImpl implements CompanyProfileService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CompanyProfileServiceImpl.class);

    private static final String CACHE_NAME = "companyProfile";
    private static final String LOGO_DIRECTORY = "uploads/company";
    private static final long MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
    private static final List<String> ALLOWED_LOGO_TYPES = Arrays.asList(
            "image/png", "image/jpeg", "image/jpg"
    );

    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public CompanyProfileServiceImpl(
            CompanyProfileRepository companyProfileRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService) {
        this.companyProfileRepository = companyProfileRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CACHE_NAME, key = "'singleton'")
    public Optional<CompanyProfileResponse> getCompanyProfile() {
        LOGGER.debug("Getting company profile");

        return companyProfileRepository.findCompanyProfile()
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, key = "'singleton'")
    public CompanyProfileResponse saveCompanyProfile(CompanyProfileRequest request, UUID userId) {
        LOGGER.debug("Saving company profile by user: {}", userId);

        User updatedByUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        // Get existing profile or create new one (upsert)
        CompanyProfile profile = companyProfileRepository.findCompanyProfile()
                .orElseGet(CompanyProfile::new);

        // Validate TRN uniqueness (only if creating or TRN changed)
        if (profile.getId() == null) {
            // Creating new profile
            if (companyProfileRepository.existsByTrn(request.getTrn())) {
                throw new ValidationException("TRN already exists");
            }
        } else {
            // Updating existing profile
            if (!profile.getTrn().equals(request.getTrn())
                    && companyProfileRepository.existsByTrnAndIdNot(request.getTrn(), profile.getId())) {
                throw new ValidationException("TRN already exists");
            }
        }

        // Update fields from request
        profile.setLegalCompanyName(request.getLegalCompanyName().trim());
        profile.setCompanyAddress(request.getCompanyAddress().trim());
        profile.setCity(request.getCity().trim());
        profile.setCountry(request.getCountry().trim());
        profile.setTrn(request.getTrn());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setEmailAddress(request.getEmailAddress().trim());
        profile.setUpdatedBy(updatedByUser);
        profile.setUpdatedAt(LocalDateTime.now());

        CompanyProfile savedProfile = companyProfileRepository.save(profile);

        LOGGER.info("Company profile saved successfully by user: {}", userId);

        return mapToResponse(savedProfile);
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, key = "'singleton'")
    public CompanyProfileLogoResponse uploadLogo(MultipartFile file, UUID userId) {
        LOGGER.debug("Uploading company logo by user: {}", userId);

        // Validate file
        validateLogoFile(file);

        // Get or create profile
        CompanyProfile profile = companyProfileRepository.findCompanyProfile()
                .orElseThrow(() -> new ValidationException("Company profile must be created before uploading logo"));

        User updatedByUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        // Delete existing logo if present
        if (StringUtils.hasText(profile.getLogoFilePath())) {
            try {
                fileStorageService.deleteFile(profile.getLogoFilePath());
                LOGGER.debug("Deleted existing logo: {}", profile.getLogoFilePath());
            } catch (Exception e) {
                LOGGER.warn("Failed to delete existing logo: {}", profile.getLogoFilePath(), e);
            }
        }

        // Store new logo
        String logoPath = fileStorageService.storeFile(file, LOGO_DIRECTORY);

        // Update profile
        profile.setLogoFilePath(logoPath);
        profile.setUpdatedBy(updatedByUser);
        profile.setUpdatedAt(LocalDateTime.now());
        companyProfileRepository.save(profile);

        // Get presigned URL
        String logoUrl = fileStorageService.getDownloadUrl(logoPath);

        LOGGER.info("Company logo uploaded successfully by user: {}", userId);

        return CompanyProfileLogoResponse.builder()
                .logoUrl(logoUrl)
                .message("Logo uploaded successfully")
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = CACHE_NAME, key = "'singleton'")
    public void deleteLogo(UUID userId) {
        LOGGER.debug("Deleting company logo by user: {}", userId);

        CompanyProfile profile = companyProfileRepository.findCompanyProfile()
                .orElseThrow(() -> new EntityNotFoundException("Company profile not found"));

        User updatedByUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        if (!StringUtils.hasText(profile.getLogoFilePath())) {
            LOGGER.debug("No logo to delete");
            return;
        }

        // Delete from S3
        try {
            fileStorageService.deleteFile(profile.getLogoFilePath());
            LOGGER.debug("Deleted logo from S3: {}", profile.getLogoFilePath());
        } catch (Exception e) {
            LOGGER.warn("Failed to delete logo from S3: {}", profile.getLogoFilePath(), e);
        }

        // Clear logo path in profile
        profile.setLogoFilePath(null);
        profile.setUpdatedBy(updatedByUser);
        profile.setUpdatedAt(LocalDateTime.now());
        companyProfileRepository.save(profile);

        LOGGER.info("Company logo deleted successfully by user: {}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean profileExists() {
        return companyProfileRepository.existsProfile();
    }

    /**
     * Validate logo file type and size.
     *
     * @param file the file to validate
     * @throws ValidationException if validation fails
     */
    private void validateLogoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Logo file is required");
        }

        // Validate file size (max 2MB)
        if (file.getSize() > MAX_LOGO_SIZE) {
            throw new ValidationException("Logo file size must not exceed 2MB");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_LOGO_TYPES.contains(contentType.toLowerCase())) {
            throw new ValidationException("Logo must be PNG or JPG format");
        }
    }

    /**
     * Map entity to response DTO.
     *
     * @param profile the entity to map
     * @return the response DTO
     */
    private CompanyProfileResponse mapToResponse(CompanyProfile profile) {
        String logoUrl = null;
        if (StringUtils.hasText(profile.getLogoFilePath())) {
            try {
                logoUrl = fileStorageService.getDownloadUrl(profile.getLogoFilePath());
            } catch (Exception e) {
                LOGGER.warn("Failed to get presigned URL for logo: {}", profile.getLogoFilePath(), e);
            }
        }

        String updatedByName = null;
        if (profile.getUpdatedBy() != null) {
            updatedByName = profile.getUpdatedBy().getFirstName() + " " + profile.getUpdatedBy().getLastName();
        }

        return CompanyProfileResponse.builder()
                .id(profile.getId())
                .legalCompanyName(profile.getLegalCompanyName())
                .companyAddress(profile.getCompanyAddress())
                .city(profile.getCity())
                .country(profile.getCountry())
                .trn(profile.getTrn())
                .phoneNumber(profile.getPhoneNumber())
                .emailAddress(profile.getEmailAddress())
                .logoUrl(logoUrl)
                .updatedByName(updatedByName)
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
