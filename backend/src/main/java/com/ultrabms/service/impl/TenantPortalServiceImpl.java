package com.ultrabms.service.impl;

import com.ultrabms.dto.tenant.ChangePasswordRequest;
import com.ultrabms.dto.tenant.DashboardResponse;
import com.ultrabms.dto.tenant.TenantProfileResponse;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.TenantDocument;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.DocumentType;
import com.ultrabms.exception.ResourceNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.TenantDocumentRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.S3Service;
import com.ultrabms.service.TenantPortalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of Tenant Portal Service
 */
@Service
@Transactional
public class TenantPortalServiceImpl implements TenantPortalService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TenantPortalServiceImpl.class);

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final TenantDocumentRepository documentRepository;
    private final S3Service s3Service;
    private final PasswordEncoder passwordEncoder;

    public TenantPortalServiceImpl(
            TenantRepository tenantRepository,
            UserRepository userRepository,
            TenantDocumentRepository documentRepository,
            S3Service s3Service,
            PasswordEncoder passwordEncoder
    ) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.s3Service = s3Service;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(UUID userId) {
        LOGGER.info("Getting dashboard data for user: {}", userId);

        Tenant tenant = tenantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found for user ID: " + userId));

        // Calculate days remaining and lease status
        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, tenant.getLeaseEndDate());
        String leaseStatus = calculateLeaseStatus(daysRemaining);

        // Build unit info
        DashboardResponse.UnitInfo unitInfo = DashboardResponse.UnitInfo.builder()
                .propertyName(tenant.getProperty().getName())
                .address(tenant.getProperty().getAddress())
                .unitNumber(tenant.getUnit().getUnitNumber())
                .floor(tenant.getUnit().getFloor())
                .bedrooms(tenant.getUnit().getBedroomCount())
                .bathrooms(tenant.getUnit().getBathroomCount())
                .leaseStartDate(tenant.getLeaseStartDate())
                .leaseEndDate(tenant.getLeaseEndDate())
                .daysRemaining(daysRemaining)
                .leaseStatus(leaseStatus)
                .build();

        // Build stats (placeholder values for modules not yet implemented)
        DashboardResponse.DashboardStats stats = DashboardResponse.DashboardStats.builder()
                .outstandingBalance(BigDecimal.ZERO) // TODO: Calculate from Invoice module (Epic 6)
                .nextPaymentDue(null) // TODO: Calculate from Invoice module (Epic 6)
                .openRequestsCount(0L) // TODO: Count from MaintenanceRequest module (Epic 4)
                .upcomingBookingsCount(0L) // TODO: Count from AmenityBooking module (future epic)
                .build();

        // Build quick actions
        List<DashboardResponse.QuickAction> quickActions = buildQuickActions();

        return DashboardResponse.builder()
                .currentUnit(unitInfo)
                .stats(stats)
                .quickActions(quickActions)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TenantProfileResponse getTenantProfile(UUID userId) {
        LOGGER.info("Getting profile for user: {}", userId);

        Tenant tenant = tenantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found for user ID: " + userId));

        // Personal info
        TenantProfileResponse.TenantPersonalInfo personalInfo = TenantProfileResponse.TenantPersonalInfo.builder()
                .id(tenant.getId())
                .firstName(tenant.getFirstName())
                .lastName(tenant.getLastName())
                .email(tenant.getEmail())
                .phone(tenant.getPhone())
                .dateOfBirth(tenant.getDateOfBirth())
                .nationalId(tenant.getNationalId())
                .emergencyContactName(tenant.getEmergencyContactName())
                .emergencyContactPhone(tenant.getEmergencyContactPhone())
                .build();

        // Lease details
        TenantProfileResponse.LeaseDetails leaseDetails = TenantProfileResponse.LeaseDetails.builder()
                .propertyName(tenant.getProperty().getName())
                .address(tenant.getProperty().getAddress())
                .unitNumber(tenant.getUnit().getUnitNumber())
                .floor(tenant.getUnit().getFloor())
                .bedrooms(tenant.getUnit().getBedroomCount())
                .bathrooms(tenant.getUnit().getBathroomCount())
                .leaseType(tenant.getLeaseType())
                .startDate(tenant.getLeaseStartDate())
                .endDate(tenant.getLeaseEndDate())
                .duration(tenant.getLeaseDuration())
                .baseRent(tenant.getBaseRent())
                .serviceCharge(tenant.getServiceCharge())
                .parkingFee(tenant.getParkingFeePerSpot().multiply(BigDecimal.valueOf(tenant.getParkingSpots())))
                .totalMonthlyRent(tenant.getTotalMonthlyRent())
                .securityDeposit(tenant.getSecurityDeposit())
                .paymentFrequency(tenant.getPaymentFrequency())
                .paymentDueDate(tenant.getPaymentDueDate())
                .paymentMethod(tenant.getPaymentMethod().name())
                .build();

        // Parking info
        TenantProfileResponse.ParkingInfo parkingInfo = TenantProfileResponse.ParkingInfo.builder()
                .spots(tenant.getParkingSpots())
                .spotNumbers(tenant.getSpotNumbers() != null ? tenant.getSpotNumbers() : "")
                .feePerSpot(tenant.getParkingFeePerSpot())
                .totalFee(tenant.getParkingFeePerSpot().multiply(BigDecimal.valueOf(tenant.getParkingSpots())))
                .mulkiyaDocumentPath(tenant.getMulkiyaDocumentPath())
                .build();

        // Documents
        List<TenantDocument> docs = documentRepository.findByTenantId(tenant.getId());
        List<TenantProfileResponse.DocumentInfo> documentInfos = docs.stream()
                .map(doc -> TenantProfileResponse.DocumentInfo.builder()
                        .id(doc.getId())
                        .type(doc.getDocumentType())
                        .fileName(doc.getFileName())
                        .fileSize(doc.getFileSize())
                        .uploadedAt(doc.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return TenantProfileResponse.builder()
                .tenant(personalInfo)
                .lease(leaseDetails)
                .parking(parkingInfo)
                .documents(documentInfos)
                .build();
    }

    @Override
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        LOGGER.info("Changing password for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ValidationException("Current password is incorrect");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        LOGGER.info("Password changed successfully for user: {}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public String getLeasePdfPath(UUID userId) {
        LOGGER.info("Getting lease PDF path for user: {}", userId);

        Tenant tenant = tenantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found for user ID: " + userId));

        // Find signed lease document
        TenantDocument leaseDoc = documentRepository.findByTenantIdAndDocumentType(tenant.getId(), DocumentType.SIGNED_LEASE)
                .orElseThrow(() -> new ResourceNotFoundException("Lease document not found"));

        return leaseDoc.getFilePath();
    }

    @Override
    public TenantDocument uploadDocument(UUID userId, MultipartFile file, String documentType) {
        LOGGER.info("Uploading document for user: {} , type: {}", userId, documentType);

        Tenant tenant = tenantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found for user ID: " + userId));

        // Validate file
        if (file.isEmpty()) {
            throw new ValidationException("File cannot be empty");
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ValidationException("File size must be less than 5MB");
        }

        // Upload to S3
        String directory = String.format("tenants/%s/additional", tenant.getId());
        String s3Path = s3Service.uploadFile(file, directory);

        // Create document record
        TenantDocument document = TenantDocument.builder()
                .tenant(tenant)
                .documentType(documentType != null ? DocumentType.valueOf(documentType) : DocumentType.OTHER)
                .fileName(file.getOriginalFilename())
                .filePath(s3Path)
                .fileSize(file.getSize())
                .build();

        return documentRepository.save(document);
    }

    @Override
    @Transactional(readOnly = true)
    public String getDocumentPath(UUID userId, UUID documentId) {
        LOGGER.info("Getting document path for user: {}, document: {}", userId, documentId);

        Tenant tenant = tenantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found for user ID: " + userId));

        TenantDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        // Verify document belongs to this tenant
        if (!document.getTenant().getId().equals(tenant.getId())) {
            throw new ValidationException("Document does not belong to this tenant");
        }

        return document.getFilePath();
    }

    @Override
    @Transactional(readOnly = true)
    public String getMulkiyaPath(UUID userId) {
        LOGGER.info("Getting Mulkiya path for user: {}", userId);

        Tenant tenant = tenantRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found for user ID: " + userId));

        if (tenant.getMulkiyaDocumentPath() == null || tenant.getMulkiyaDocumentPath().isEmpty()) {
            throw new ResourceNotFoundException("Mulkiya document not found");
        }

        return tenant.getMulkiyaDocumentPath();
    }

    @Override
    public void updateLanguagePreference(UUID userId, String language) {
        LOGGER.info("Updating language preference for user: {} to {}", userId, language);

        // TODO: Implement when User entity has language preference field
        // For now, this is a placeholder
        LOGGER.warn("Language preference update not yet implemented");
    }

    // Helper methods

    private String calculateLeaseStatus(long daysRemaining) {
        if (daysRemaining < 0) {
            return "EXPIRED";
        } else if (daysRemaining <= 60) {
            return "EXPIRING_SOON";
        } else {
            return "ACTIVE";
        }
    }

    private List<DashboardResponse.QuickAction> buildQuickActions() {
        List<DashboardResponse.QuickAction> actions = new ArrayList<>();

        actions.add(DashboardResponse.QuickAction.builder()
                .name("Submit Maintenance Request")
                .url("/tenant/requests/new")
                .icon("tools")
                .build());

        actions.add(DashboardResponse.QuickAction.builder()
                .name("Make Payment")
                .url("/tenant/payments/new")
                .icon("credit-card")
                .build());

        actions.add(DashboardResponse.QuickAction.builder()
                .name("Book Amenity")
                .url("/tenant/amenities/book")
                .icon("calendar")
                .build());

        actions.add(DashboardResponse.QuickAction.builder()
                .name("View Lease Agreement")
                .url("/api/v1/tenant/lease/download")
                .icon("file-text")
                .build());

        return actions;
    }
}
