package com.ultrabms.dto.tenant;

import com.ultrabms.entity.enums.LeaseType;
import com.ultrabms.entity.enums.PaymentFrequency;
import com.ultrabms.entity.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO for creating a new tenant.
 * Includes all personal information, lease details, rent breakdown, parking, payment schedule.
 * Documents are sent as multipart files.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTenantRequest {

    // =============================
    // PERSONAL INFORMATION
    // =============================

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must be less than 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must be less than 100 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must be less than 255 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must be less than 20 characters")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Phone must be in E.164 format (e.g., +971501234567)")
    private String phone;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "National ID is required")
    @Size(max = 50, message = "National ID must be less than 50 characters")
    private String nationalId;

    @NotBlank(message = "Nationality is required")
    @Size(max = 100, message = "Nationality must be less than 100 characters")
    private String nationality;

    @NotBlank(message = "Emergency contact name is required")
    @Size(max = 100, message = "Emergency contact name must be less than 100 characters")
    private String emergencyContactName;

    @NotBlank(message = "Emergency contact phone is required")
    @Size(max = 20, message = "Emergency contact phone must be less than 20 characters")
    private String emergencyContactPhone;

    // =============================
    // LEASE INFORMATION
    // =============================

    @NotNull(message = "Property ID is required")
    private UUID propertyId;

    @NotNull(message = "Unit ID is required")
    private UUID unitId;

    @NotNull(message = "Lease start date is required")
    @FutureOrPresent(message = "Lease start date must be today or in the future")
    private LocalDate leaseStartDate;

    @NotNull(message = "Lease end date is required")
    @Future(message = "Lease end date must be in the future")
    private LocalDate leaseEndDate;

    @NotNull(message = "Lease type is required")
    private LeaseType leaseType;

    @NotNull(message = "Renewal option is required")
    private Boolean renewalOption;

    // =============================
    // RENT BREAKDOWN
    // =============================

    @NotNull(message = "Base rent is required")
    @DecimalMin(value = "0.01", message = "Base rent must be greater than 0")
    private BigDecimal baseRent;

    @DecimalMin(value = "0.00", message = "Admin fee cannot be negative")
    private BigDecimal adminFee;

    @DecimalMin(value = "0.00", message = "Service charge cannot be negative")
    private BigDecimal serviceCharge;

    @NotNull(message = "Security deposit is required")
    @DecimalMin(value = "0.01", message = "Security deposit must be greater than 0")
    private BigDecimal securityDeposit;

    // =============================
    // PARKING ALLOCATION
    // =============================

    @Min(value = 0, message = "Parking spots cannot be negative")
    @Max(value = 10, message = "Maximum 10 parking spots allowed")
    private Integer parkingSpots;

    @DecimalMin(value = "0.00", message = "Parking fee cannot be negative")
    private BigDecimal parkingFeePerSpot;

    @Size(max = 200, message = "Spot numbers must be less than 200 characters")
    private String spotNumbers;

    // =============================
    // PAYMENT SCHEDULE
    // =============================

    @NotNull(message = "Payment frequency is required")
    private PaymentFrequency paymentFrequency;

    @NotNull(message = "Payment due date is required")
    @Min(value = 1, message = "Due date must be between 1 and 31")
    @Max(value = 31, message = "Due date must be between 1 and 31")
    private Integer paymentDueDate;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @Min(value = 1, message = "PDC cheque count must be at least 1")
    @Max(value = 12, message = "Maximum 12 PDC cheques allowed")
    private Integer pdcChequeCount;

    // =============================
    // LEAD CONVERSION (OPTIONAL)
    // =============================

    private UUID leadId;
    private UUID quotationId;

    // =============================
    // DOCUMENTS (MultipartFiles)
    // Note: These are not part of the DTO validation,
    // but are passed separately in the multipart request
    // =============================
    // emiratesIdFile, passportFile, visaFile, signedLeaseFile, mulkiyaFile, additionalFiles[]
}
