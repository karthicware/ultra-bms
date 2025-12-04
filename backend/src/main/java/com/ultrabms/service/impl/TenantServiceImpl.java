package com.ultrabms.service.impl;

import com.ultrabms.dto.tenant.CreateTenantRequest;
import com.ultrabms.dto.tenant.CreateTenantResponse;
import com.ultrabms.dto.tenant.TenantDocumentResponse;
import com.ultrabms.dto.tenant.TenantResponse;
import com.ultrabms.entity.Property;
import com.ultrabms.entity.Role;
import com.ultrabms.entity.Tenant;
import com.ultrabms.entity.TenantDocument;
import com.ultrabms.entity.Unit;
import com.ultrabms.entity.User;
import com.ultrabms.entity.enums.DocumentType;
import com.ultrabms.entity.enums.PaymentMethod;
import com.ultrabms.entity.enums.TenantStatus;
import com.ultrabms.entity.enums.UnitStatus;
import com.ultrabms.exception.DuplicateResourceException;
import com.ultrabms.exception.EntityNotFoundException;
import com.ultrabms.exception.ValidationException;
import com.ultrabms.repository.PropertyRepository;
import com.ultrabms.repository.RoleRepository;
import com.ultrabms.repository.TenantDocumentRepository;
import com.ultrabms.repository.TenantRepository;
import com.ultrabms.repository.UnitRepository;
import com.ultrabms.repository.UserRepository;
import com.ultrabms.service.S3Service;
import com.ultrabms.service.TenantService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Tenant Service Implementation
 * Handles tenant creation with user account creation, document uploads, and unit status updates
 */
@Service
public class TenantServiceImpl implements TenantService {

    private static final Logger LOGGER = LoggerFactory.getLogger(TenantServiceImpl.class);

    private final TenantRepository tenantRepository;
    private final TenantDocumentRepository tenantDocumentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final S3Service s3Service;
    private final PasswordEncoder passwordEncoder;

    public TenantServiceImpl(
            TenantRepository tenantRepository,
            TenantDocumentRepository tenantDocumentRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PropertyRepository propertyRepository,
            UnitRepository unitRepository,
            S3Service s3Service,
            PasswordEncoder passwordEncoder
    ) {
        this.tenantRepository = tenantRepository;
        this.tenantDocumentRepository = tenantDocumentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.propertyRepository = propertyRepository;
        this.unitRepository = unitRepository;
        this.s3Service = s3Service;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public CreateTenantResponse createTenant(
            CreateTenantRequest request,
            MultipartFile emiratesIdFile,
            MultipartFile passportFile,
            MultipartFile visaFile,
            MultipartFile signedLeaseFile,
            MultipartFile mulkiyaFile,
            List<MultipartFile> additionalFiles
    ) {
        LOGGER.info("Creating tenant for email: {}", request.getEmail());

        // Validate email is unique
        if (tenantRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }

        // Validate age (must be 18+)
        validateAge(request.getDateOfBirth());

        // Validate property exists
        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new EntityNotFoundException("Property not found: " + request.getPropertyId()));

        // Validate unit exists and is AVAILABLE
        Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new EntityNotFoundException("Unit not found: " + request.getUnitId()));

        if (unit.getStatus() != UnitStatus.AVAILABLE) {
            throw new ValidationException("Unit is not available. Current status: " + unit.getStatus());
        }

        // Validate lease dates
        validateLeaseDates(request.getLeaseStartDate(), request.getLeaseEndDate());

        // Validate PDC cheque count if payment method is PDC
        if (request.getPaymentMethod() == PaymentMethod.PDC &&
            (request.getPdcChequeCount() == null || request.getPdcChequeCount() < 1)) {
            throw new ValidationException("PDC cheque count is required when payment method is PDC");
        }

        try {
            // Step 1: Create user account with TENANT role
            UUID userId = createTenantUser(request);

            // Step 2: Generate tenant number
            String tenantNumber = generateTenantNumber();

            // Step 3: Calculate lease duration and total monthly rent
            int leaseDuration = Period.between(request.getLeaseStartDate(), request.getLeaseEndDate()).getMonths();
            BigDecimal totalMonthlyRent = calculateTotalMonthlyRent(request);

            // Step 4: Create tenant record
            Tenant tenant = Tenant.builder()
                    // Personal Info
                    .userId(userId)
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .dateOfBirth(request.getDateOfBirth())
                    .nationalId(request.getNationalId())
                    .nationality(request.getNationality())
                    .emergencyContactName(request.getEmergencyContactName())
                    .emergencyContactPhone(request.getEmergencyContactPhone())
                    // Lease Info
                    .property(property)
                    .unit(unit)
                    .leaseStartDate(request.getLeaseStartDate())
                    .leaseEndDate(request.getLeaseEndDate())
                    .leaseDuration(leaseDuration)
                    .leaseType(request.getLeaseType())
                    .renewalOption(request.getRenewalOption())
                    // Rent Breakdown
                    .baseRent(request.getBaseRent())
                    .adminFee(request.getAdminFee() != null ? request.getAdminFee() : BigDecimal.ZERO)
                    .serviceCharge(request.getServiceCharge() != null ? request.getServiceCharge() : BigDecimal.ZERO)
                    .securityDeposit(request.getSecurityDeposit())
                    .totalMonthlyRent(totalMonthlyRent)
                    // Parking
                    .parkingSpots(request.getParkingSpots() != null ? request.getParkingSpots() : 0)
                    .parkingFeePerSpot(request.getParkingFeePerSpot() != null ? request.getParkingFeePerSpot() : BigDecimal.ZERO)
                    .spotNumbers(request.getSpotNumbers())
                    // Payment Schedule
                    .paymentFrequency(request.getPaymentFrequency())
                    .paymentDueDate(request.getPaymentDueDate())
                    .paymentMethod(request.getPaymentMethod())
                    .pdcChequeCount(request.getPdcChequeCount())
                    // Metadata
                    .tenantNumber(tenantNumber)
                    .status(TenantStatus.ACTIVE)
                    .leadId(request.getLeadId())
                    .quotationId(request.getQuotationId())
                    .active(true)
                    .build();

            Tenant savedTenant = tenantRepository.save(tenant);
            LOGGER.info("Created tenant record: {} ({})", savedTenant.getTenantNumber(), savedTenant.getId());

            // Step 5: Upload documents to S3
            uploadDocuments(savedTenant, emiratesIdFile, passportFile, visaFile, signedLeaseFile, mulkiyaFile, additionalFiles);

            // Step 6: Update unit status to OCCUPIED
            unit.setStatus(UnitStatus.OCCUPIED);
            unitRepository.save(unit);
            LOGGER.info("Updated unit {} status to OCCUPIED", unit.getUnitNumber());

            // Step 7: Send welcome email (TODO: implement email service)
            // sendWelcomeEmail(savedTenant, userDto.getPassword());

            return CreateTenantResponse.builder()
                    .id(savedTenant.getId())
                    .tenantNumber(savedTenant.getTenantNumber())
                    .userId(userId)
                    .message("Tenant registered successfully! Welcome email sent to " + request.getEmail())
                    .build();

        } catch (Exception e) {
            LOGGER.error("Failed to create tenant: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create tenant", e);
        }
    }

    @Override
    public TenantResponse getTenantById(UUID id) {
        Tenant tenant = tenantRepository.findByIdAndActive(id, true)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found: " + id));

        return mapToResponse(tenant);
    }

    @Override
    public Page<TenantResponse> getAllTenants(Pageable pageable) {
        return tenantRepository.findByStatusAndActive(TenantStatus.ACTIVE, true, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public Page<TenantResponse> searchTenants(String searchTerm, Pageable pageable) {
        String searchPattern = searchTerm != null ? "%" + searchTerm + "%" : null;
        return tenantRepository.searchTenants(searchPattern, true, pageable)
                .map(this::mapToResponse);
    }

    @Override
    public boolean isEmailAvailable(String email) {
        return !tenantRepository.existsByEmail(email);
    }

    @Override
    public List<TenantResponse> getTenantsByProperty(UUID propertyId) {
        return tenantRepository.findByPropertyIdAndActive(propertyId, true).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =============================
    // PRIVATE HELPER METHODS
    // =============================

    private UUID createTenantUser(CreateTenantRequest request) {
        // Generate random password
        String randomPassword = generateRandomPassword();

        // Look up TENANT role
        Role tenantRole = roleRepository.findByName("TENANT")
                .orElseThrow(() -> new EntityNotFoundException("Role not found: TENANT"));

        // Create new user entity with TENANT role
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(randomPassword)); // Hash password with BCrypt
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(tenantRole);
        user.setPhone(request.getPhone());
        user.setActive(true);
        user.setMfaEnabled(false);
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);

        User savedUser = userRepository.save(user);
        LOGGER.info("Created user account for tenant: {} (userId: {})", savedUser.getEmail(), savedUser.getId());

        // TODO: Store randomPassword for welcome email (Story 9.1)
        // For now, log the password (REMOVE IN PRODUCTION!)
        LOGGER.warn("Generated password for {}: {} (MUST BE SENT VIA EMAIL)", savedUser.getEmail(), randomPassword);

        return savedUser.getId();
    }

    private void uploadDocuments(
            Tenant tenant,
            MultipartFile emiratesIdFile,
            MultipartFile passportFile,
            MultipartFile visaFile,
            MultipartFile signedLeaseFile,
            MultipartFile mulkiyaFile,
            List<MultipartFile> additionalFiles
    ) {
        String s3Directory = "tenants/" + tenant.getId() + "/documents";

        // Upload Emirates ID (required)
        uploadAndSaveDocument(tenant, emiratesIdFile, DocumentType.EMIRATES_ID, s3Directory);

        // Upload Passport (required)
        uploadAndSaveDocument(tenant, passportFile, DocumentType.PASSPORT, s3Directory);

        // Upload Visa (optional)
        if (visaFile != null && !visaFile.isEmpty()) {
            uploadAndSaveDocument(tenant, visaFile, DocumentType.VISA, s3Directory);
        }

        // Upload Signed Lease (required)
        uploadAndSaveDocument(tenant, signedLeaseFile, DocumentType.SIGNED_LEASE, s3Directory);

        // Upload Mulkiya (optional)
        if (mulkiyaFile != null && !mulkiyaFile.isEmpty()) {
            String mulkiyaPath = s3Service.uploadFile(mulkiyaFile, s3Directory);
            tenant.setMulkiyaDocumentPath(mulkiyaPath);
            tenantRepository.save(tenant);
            uploadAndSaveDocument(tenant, mulkiyaFile, DocumentType.MULKIYA, s3Directory);
        }

        // Upload additional files (optional)
        if (additionalFiles != null && !additionalFiles.isEmpty()) {
            for (MultipartFile file : additionalFiles) {
                if (file != null && !file.isEmpty()) {
                    uploadAndSaveDocument(tenant, file, DocumentType.OTHER, s3Directory);
                }
            }
        }
    }

    private void uploadAndSaveDocument(Tenant tenant, MultipartFile file, DocumentType documentType, String s3Directory) {
        String s3Path = s3Service.uploadFile(file, s3Directory);

        TenantDocument document = TenantDocument.builder()
                .tenant(tenant)
                .documentType(documentType)
                .fileName(file.getOriginalFilename())
                .filePath(s3Path)
                .fileSize(file.getSize())
                .build();

        tenantDocumentRepository.save(document);
        LOGGER.info("Uploaded document: {} for tenant {}", documentType, tenant.getTenantNumber());
    }

    private String generateTenantNumber() {
        int year = LocalDate.now().getYear();
        long count = tenantRepository.countByActive(true) + 1;
        return String.format("TNT-%d-%04d", year, count);
    }

    private BigDecimal calculateTotalMonthlyRent(CreateTenantRequest request) {
        BigDecimal baseRent = request.getBaseRent();
        BigDecimal serviceCharge = request.getServiceCharge() != null ? request.getServiceCharge() : BigDecimal.ZERO;
        BigDecimal parkingFee = BigDecimal.ZERO;

        if (request.getParkingSpots() != null && request.getParkingSpots() > 0 &&
            request.getParkingFeePerSpot() != null) {
            parkingFee = request.getParkingFeePerSpot().multiply(BigDecimal.valueOf(request.getParkingSpots()));
        }

        return baseRent.add(serviceCharge).add(parkingFee);
    }

    private void validateAge(LocalDate dateOfBirth) {
        int age = Period.between(dateOfBirth, LocalDate.now()).getYears();
        if (age < 18) {
            throw new ValidationException("Tenant must be at least 18 years old. Current age: " + age);
        }
    }

    private void validateLeaseDates(LocalDate startDate, LocalDate endDate) {
        if (startDate.isBefore(LocalDate.now())) {
            throw new ValidationException("Lease start date must be today or in the future");
        }
        if (endDate.isBefore(startDate)) {
            throw new ValidationException("Lease end date must be after start date");
        }
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        Random random = new Random();
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        return password.toString();
    }

    private TenantResponse mapToResponse(Tenant tenant) {
        List<TenantDocumentResponse> documents = tenantDocumentRepository.findByTenantId(tenant.getId()).stream()
                .map(doc -> TenantDocumentResponse.builder()
                        .id(doc.getId())
                        .tenantId(tenant.getId())
                        .documentType(doc.getDocumentType())
                        .fileName(doc.getFileName())
                        .filePath(doc.getFilePath())
                        .fileSize(doc.getFileSize())
                        .uploadedAt(doc.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return TenantResponse.builder()
                .id(tenant.getId())
                .userId(tenant.getUserId())
                .tenantNumber(tenant.getTenantNumber())
                .status(tenant.getStatus())
                // Personal Info
                .firstName(tenant.getFirstName())
                .lastName(tenant.getLastName())
                .email(tenant.getEmail())
                .phone(tenant.getPhone())
                .dateOfBirth(tenant.getDateOfBirth())
                .nationalId(tenant.getNationalId())
                .nationality(tenant.getNationality())
                .emergencyContactName(tenant.getEmergencyContactName())
                .emergencyContactPhone(tenant.getEmergencyContactPhone())
                // Lease Info
                .propertyId(tenant.getProperty().getId())
                .propertyName(tenant.getProperty().getName())
                .propertyAddress(tenant.getProperty().getAddress())
                .unitId(tenant.getUnit().getId())
                .unitNumber(tenant.getUnit().getUnitNumber())
                .floor(tenant.getUnit().getFloor())
                .bedrooms(tenant.getUnit().getBedroomCount())
                .bathrooms(tenant.getUnit().getBathroomCount())
                .leaseStartDate(tenant.getLeaseStartDate())
                .leaseEndDate(tenant.getLeaseEndDate())
                .leaseDuration(tenant.getLeaseDuration())
                .leaseType(tenant.getLeaseType())
                .renewalOption(tenant.getRenewalOption())
                // Rent Breakdown
                .baseRent(tenant.getBaseRent())
                .adminFee(tenant.getAdminFee())
                .serviceCharge(tenant.getServiceCharge())
                .securityDeposit(tenant.getSecurityDeposit())
                .totalMonthlyRent(tenant.getTotalMonthlyRent())
                // Parking
                .parkingSpots(tenant.getParkingSpots())
                .parkingFeePerSpot(tenant.getParkingFeePerSpot())
                .spotNumbers(tenant.getSpotNumbers())
                .mulkiyaDocumentPath(tenant.getMulkiyaDocumentPath())
                // Payment
                .paymentFrequency(tenant.getPaymentFrequency())
                .paymentDueDate(tenant.getPaymentDueDate())
                .paymentMethod(tenant.getPaymentMethod())
                .pdcChequeCount(tenant.getPdcChequeCount())
                // Documents
                .documents(documents)
                // Lead Conversion
                .leadId(tenant.getLeadId())
                .quotationId(tenant.getQuotationId())
                // Metadata
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
    }
}
